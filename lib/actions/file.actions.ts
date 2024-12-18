'use server'

import { InputFile } from "node-appwrite/file";
import { createAdminClient, createSessionClient } from "../appwrite"
import { appwriteConfig } from "../appwrite/config";
import { ID, Models, Query } from "node-appwrite";
import { constructFileUrl, getFileType, parseStringify } from "../utils";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./user.actions";

const handleError = (error: unknown, message: string) => {
    console.log(error, message);
    throw error;
};

export const uploadFile = async ({ file, ownerId, accountId, path }: UploadFileProps) => {
    const { storage, databases } = await createAdminClient();

    try {
        const inputFile = InputFile.fromBuffer(file, file.name);
        const bucketFile = await storage.createFile(
            appwriteConfig.bucketId, 
            ID.unique(), 
            inputFile,
        );

        const fileDocument = {
            type: getFileType(bucketFile.name).type,
            name: bucketFile.name,
            url: constructFileUrl(bucketFile.$id),
            extension: getFileType(bucketFile.name).extension,
            size: bucketFile.sizeOriginal,
            owner: ownerId,
            accountId,
            users: [],
            bucketFileId: bucketFile.$id,
        };

        const newFile = await databases
            .createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.filesCollectionId,
                ID.unique(),
                fileDocument,
            )
            .catch(async (error: unknown) => {
                await storage.deleteFile(appwriteConfig.bucketId, bucketFile.$id);
                handleError(error, 'Failed to create file document');
            });

        revalidatePath(path);
        return parseStringify(newFile); 

    } catch (error) {
        handleError(error, 'Failed to upload file');
    }
}

const createQueries = (currentUser: Models.Document, types: string[], searchText: string, sort: string, limit?: number) => {
    const queries = [
        Query.or([
            Query.equal('owner', [currentUser.$id]),
            Query.contains('users', [currentUser.email])  // checking if auth user is shared the access to the file. in another word, if the file had been shared with auth user
        ])
    ];

    if(types.length > 0) queries.push(Query.equal('type', types));
    if(searchText) queries.push(Query.contains('name', searchText));
    if(limit) queries.push(Query.limit(limit));

    if(sort) {
        const [sortBy, orderBy] = sort.split('-');

        queries.push(orderBy === 'asc' ? Query.orderAsc(sortBy) : Query.orderDesc(sortBy));
    } else {
        queries.push(Query.orderDesc('$createdAt'));
    }

    return queries;
}

// desc - latest value first
// asc  - earliest value first
export const getFiles = async ({ types = [], searchText = '', sort = '$createdAt-desc', limit}: GetFilesProps) => {
    const { databases } = await createAdminClient();

    try {
        const currentUser = await getCurrentUser();

        if(!currentUser) throw new Error('User not found');

        const queries = createQueries(currentUser, types, searchText, sort, limit);

        const files = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            queries,
        );

        return parseStringify(files);
    } catch (error) {
        handleError(error, 'Failed to get the files.');
    }
}

export const renameFile = async ( {fileId, name, extension, path}: RenameFileProps ) => {
    const { databases } = await createAdminClient();

    try {
        const newName = `${name}`;
        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            {
                name: newName,
            },
        );

        revalidatePath(path);
        return parseStringify(updatedFile);
    } catch (error) {
        handleError(error, 'Failed to rename file');
    }
}

export const updateFileUsers = async ({ fileId, emails, path }: UpdateFileUsersProps) => {
    const { databases } = await createAdminClient();

    try {
        // Step 1: Retrieve the existing document
        const existingFile = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId
        );

        // Step 2: Merge existing users with new emails
        const existingUsers = existingFile.users || []; // Ensure it's an array
        const updatedUsers = [...new Set([...existingUsers, ...emails])]; // Combine and remove duplicates

        // Step 3: Update the document with the merged users
        const updatedFile = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
            {
                users: updatedUsers,
            }
        );

        revalidatePath(path);
        return parseStringify(updatedFile);
    } catch (error) {
        handleError(error, 'Failed to update file users');
        return null; 
    }
};


export const deleteFile = async ( {fileId, bucketFileId, path}: DeleteFileProps ) => {
    const { databases, storage } = await createAdminClient();

    try {
        const deletedFile = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            fileId,
        );

        if(deletedFile) {
            await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);
        }
        revalidatePath(path);
        return parseStringify({ status: 'success'});
    } catch (error) {
        handleError(error, 'Failed to delete this file.');
    }
}



// ============================== TOTAL FILE SPACE USED
export async function getTotalSpaceUsed() {
    try {
      const { databases } = await createSessionClient();
      const currentUser = await getCurrentUser();
      if (!currentUser) throw new Error("User is not authenticated.");
  
      const files = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        [Query.equal("owner", [currentUser.$id])],
      );
  
      const totalSpace = {
        image: { size: 0, latestDate: "" },
        document: { size: 0, latestDate: "" },
        video: { size: 0, latestDate: "" },
        audio: { size: 0, latestDate: "" },
        other: { size: 0, latestDate: "" },
        used: 0,
        all: 2 * 1024 * 1024 * 1024 /* 2GB available bucket storage */,
      };
  
      files.documents.forEach((file) => {
        const fileType = file.type as FileType;
        totalSpace[fileType].size += file.size;
        totalSpace.used += file.size;
  
        if (
          !totalSpace[fileType].latestDate ||
          new Date(file.$updatedAt) > new Date(totalSpace[fileType].latestDate)
        ) {
          totalSpace[fileType].latestDate = file.$updatedAt;
        }
      });
  
      return parseStringify(totalSpace);
    } catch (error) {
      handleError(error, "Error calculating total space used:, ");
    }
}

