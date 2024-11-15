import Image from 'next/image'
import React from 'react'
import { Button } from './ui/button'
import Search from '@/components/Search'
import FileUploader from '@/components/FileUploader'

const Header = () => {
  return (
    <header className='header'>
        <Search />
        <div className="header-wrapper">
            <FileUploader />

            <form action="">
                <Button type='submit' className='sign-out-button'>
                    <Image 
                        src='/assets/icons/logout.svg'
                        alt='logo'
                        width={24}
                        height={24}
                        className='w-6'
                    />
                </Button>
            </form>
        </div>
    </header>
  )
}

export default Header