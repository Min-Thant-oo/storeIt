import Card from '@/components/Card';
import Sort from '@/components/Sort';
import { getFiles } from '@/lib/actions/file.actions';
import { getCurrentUser } from '@/lib/actions/user.actions';
import { getFileTypesParams } from '@/lib/utils';
import { Models } from 'node-appwrite';
import React from 'react'

const page = async ({ params, searchParams }: SearchParamProps) => {
    // type so tr ka slash pe yin win lr tae dynamic value
    const type = (await params)?.type as string || '';

    const searchText = ((await searchParams)?.query as string) || '';
    const sort = ((await searchParams)?.sort as string) || '';

    const types = getFileTypesParams(type) as FileType[];

    const files = await getFiles({ types, searchText, sort });

    const currentUser = await getCurrentUser();

     // Calculate total size in megabytes
     const totalSizeInMB = files.documents.reduce((total, file) => {
        // Assuming file.size is in bytes
        return total + (file.size || 0);
    }, 0) / (1024 * 1024);

    return (
        <div className='page-container'>
            <section className="w-full">
                <h1 className="h1 capitalize">{type}</h1>
                <div className="total-size-section">
                    <p className="body-1">
                        Total: <span className='h5'>{totalSizeInMB.toFixed(2)} Megabyte</span>
                    </p>

                    <div className="sort-container">
                        <p className="body-1 hidden sm:block text-light-200">
                            Sort by: 
                        </p>
                        <Sort />
                    </div>
                </div>
            </section>

            {/* Render the files */}
            {files.total > 0 ? (
                <section className='file-list'>
                    {files.documents.map((file: Models.Document) => (
                        <Card key={file.$id} file={file} currentUserEmail={currentUser.email} />
                    ))}
                </section>
            ) : <p className='empty-list'>No files uploaded.</p>}
        </div>
    )
}

export default page