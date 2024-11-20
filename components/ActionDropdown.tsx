'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Image from 'next/image'
import { Models } from 'node-appwrite'
import { actionsDropdownItems } from '@/constant'
import { constructDownloadUrl } from '@/lib/utils'
import Link from 'next/link'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { deleteFile, renameFile, updateFileUsers } from '@/lib/actions/file.actions'
import { usePathname } from 'next/navigation'
import { FileDetails, ShareInput } from './ActionsModalContent'
import { useToast } from '@/hooks/use-toast';


const ActionDropdown = ({ file, currentUserEmail }: { file: Models.Document; currentUserEmail: string}) => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropDownOpen, setIsDropDownOpen] = useState(false);
    const [action, setAction] = useState<ActionType | null >(null);
    const [name, setName] = useState(file.name);
    const [isLoading, setIsLoading] = useState(false);
    const [emails, setEmails] = useState<string []>([]);

    const path = usePathname();

    const { toast } = useToast();


    const closeAllModals = () => {
        setIsModalOpen(false);
        setIsDropDownOpen(false);
        setAction(null);
        setName(file.name)
        // setEmails([])
    }

    const handleAction = async () => {
        if(!action) return;
        setIsLoading(true);

        let success = false;
        const actions = {
            rename: () => renameFile({ fileId: file.$id, name, extension: file.extension, path }),
            share: () => updateFileUsers({ fileId: file.$id, emails, path }),
            delete: () => deleteFile({ fileId: file.$id, bucketFileId: file.bucketFileId, path })
        };

        success = await actions[action.value as keyof typeof actions]();
        if(success) closeAllModals();
        setIsLoading(false);
        closeAllModals();

        toast({
            description: (
              <p className="body-2 text-white">
                <span className="font-semibold">{action.label + 'd'}!</span>
              </p>
            ),
            className: "bg-brand !rounded-[10px]",
          });
    }

    const handleRemoveUser = async (email: string) => {
        const updatedEmails = emails.filter((e) => e !== email);

        const success = await updateFileUsers({
            fileId: file.$id,
            emails: updatedEmails,
            path,
        });
        if(success) setEmails(updatedEmails);
        closeAllModals();
    }

    // Modal for each action of dropdown
    const renderDialogContent = () => {
        if(!action) return null;

        const { value, label } = action;

        return (
            <DialogContent className='shad-dialog button'>
                <DialogHeader className='flex flex-col gap-3'>
                    <DialogTitle className='text-center text-light-100'>{label}</DialogTitle>
                    
                    {/* For Rename */}
                    {value === 'rename' && (
                        <Input 
                            type='text'
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAction()}
                        />
                    )}

                    {/* For File Detail */}
                    {value === 'details' && <FileDetails file={file} />}

                    {/* For Share */}
                    {value === 'share' && (
                        <ShareInput 
                            file={file} 
                            onInputChange={setEmails}
                            onRemove={handleRemoveUser}
                            currentUserEmail={currentUserEmail}
                        />
                    )}

                    {/* For Delete */}
                    {value === 'delete' && (
                        <p className="delete-confirmation">
                            Are you sure you want to delete {` `}
                            <span className="delete-file-name">{file.name}</span>?
                        </p>
                    )}

                </DialogHeader>
                {['rename', 'share', 'delete'].includes(value) && (
                    <DialogFooter className='flex flex-col gap-3 md:flex-row'>
                        <Button onClick={closeAllModals} className='modal-cancel-button'>Cancel</Button>
                        <Button 
                            onClick={handleAction} 
                            className='modal-submit-button'
                            disabled={isLoading}
                        >
                            <p className="capitalize">{value}</p>
                            {isLoading && (
                                <Image 
                                    src='/assets/icons/loader.svg'
                                    alt='loader'
                                    width={24}
                                    height={24}
                                    className='animate-spin'
                                />
                            )}
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        )
    }

    return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
    <DropdownMenu open={isDropDownOpen} onOpenChange={setIsDropDownOpen}>
        <DropdownMenuTrigger className='shad-no-focus'>
            <Image
                src='assets/icons/dots.svg'
                alt='dots'
                width={25}
                height={25}
            />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuLabel className='max-w-[200px] truncate'>{file.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {actionsDropdownItems.map((actionItem) => (
                <DropdownMenuItem 
                    key={actionItem.value} 
                    className='shad-dropdown-item' 
                    onClick={() => {
                        setAction(actionItem)
                        if(['rename', 'details', 'share', 'delete'].includes(actionItem.value)) {
                            setIsModalOpen(true)
                        } else {
                            setIsDropDownOpen(false)
                        }
                    }}
                >
                    {actionItem.value === 'download' ? (
                        <Link 
                            href={constructDownloadUrl(file.bucketFileId)}
                            download={file.name}
                            className='flex items-center gap-2'
                        >
                            <Image
                                src={actionItem.icon}
                                alt={actionItem.label}
                                width={30}
                                height={30}
                            />
                            {actionItem.label}
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Image
                                src={actionItem.icon}
                                alt={actionItem.label}
                                width={30}
                                height={30}
                            />
                            {actionItem.label}
                        </div>
                    )}
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
            {renderDialogContent()}
    </Dialog>

    )
}

export default ActionDropdown