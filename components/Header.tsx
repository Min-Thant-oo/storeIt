'use client';
import Image from 'next/image'
import React from 'react'
import { Button } from './ui/button'
import Search from '@/components/Search'
import FileUploader from '@/components/FileUploader'
import { signoutUser } from '@/lib/actions/user.actions'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from 'react'

const Header = ({ userId, accountId}: {userId: string; accountId: string}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await signoutUser();
    setIsLoading(false);
    setIsDialogOpen(false);
  }

  return (
    <header className='header'>
        <Search />
        <div className="header-wrapper">
            <FileUploader ownerId={userId} accountId={accountId} />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button className='sign-out-button' title='Log out'>
                        <Image 
                            src='/assets/icons/logout.svg'
                            alt='logo'
                            width={24}
                            height={24}
                            className='w-6'
                        />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className='text-center text-light-100'>Log out?</DialogTitle>
                        <p className='text-center text-light-100'>Are you sure you want to logout?</p>
                    </DialogHeader>
                    <DialogFooter className='flex flex-col gap-3 md:flex-row'>
                        <Button 
                            className='h-[52px] flex-1 rounded-full bg-white text-light-100 hover:bg-transparent hover:shadow-lg'
                            onClick={() => setIsDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className='primary-btn !mx-0 h-[52px] flex-1'
                            onClick={handleLogout}
                            disabled={isLoading}
                        >
                            Logout
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
                </DialogContent>
            </Dialog>
        </div>
    </header>
  )
}

export default Header