import { Box, BoxProps, Tooltip } from '@chakra-ui/react'
import { useRouter } from 'next/router'
import { IconType } from 'react-icons'

type MenuItemProps = BoxProps & {
  label: string
  href: string
  Icon: IconType
}

const MenuItem = ({ label, href, Icon, ...rest }: MenuItemProps) => {
  const { pathname, push } = useRouter()

  return (
    <Tooltip placement="right" label={label}>
      <Box
        cursor="pointer"
        color={pathname === href ? '#4299E1' : '#A0AEC0'}
        onClick={() => push(href)}
        _hover={{ color: pathname === href ? '#2B6CB0' : '#4299E1' }}
        {...rest}
      >
        <Icon size={30} />
      </Box>
    </Tooltip>
  )
}

export default MenuItem
