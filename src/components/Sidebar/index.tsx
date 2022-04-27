import { Box, Divider, Flex } from '@chakra-ui/react'
import type { NextPage } from 'next'
import { AiFillHome, AiFillPlusSquare } from 'react-icons/ai'
import { BsCartCheckFill } from 'react-icons/bs'
import MenuItem from '../menu-item'

const Sidebar: NextPage = () => {
  return (
    <Box
      boxShadow="lg"
      display="flex"
      bg="white"
      alignItems="center"
      py={60}
      px={2}
      justifyContent="start"
      h="100vh"
      position="relative"
      flexDirection="column"
    >
      <MenuItem label="Menu Inicial" href="/" Icon={AiFillHome} />

      <Divider mt={8} />

      <Flex flexGrow={1} justifyContent="center" direction="column" px={4}>
        <MenuItem label="Compras" mb={12} href="/purchases" Icon={AiFillPlusSquare} />

        <MenuItem label="Vendas" href="/sales" Icon={BsCartCheckFill} />
      </Flex>
    </Box>
  )
}

export default Sidebar
