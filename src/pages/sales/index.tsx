/* eslint-disable react-hooks/exhaustive-deps */
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
  useMediaQuery,
  Select as SelectChakra,
  FormErrorMessage,
} from '@chakra-ui/react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { ChangeEvent, useEffect, useState } from 'react'
import { BsFileEarmarkPlusFill } from 'react-icons/bs'
import { FiTrash2 } from 'react-icons/fi'
import { HiArrowSmRight } from 'react-icons/hi'
import { IoIosRemoveCircle } from 'react-icons/io'
import Select from 'react-select'
import InputNumber from '../../components/Input-number'
import Sidebar from '../../components/Sidebar'
import { api } from '../../services/api'
import { Product } from '../../types/product'
import { formatPrice, notify } from '../../utils/misc'

export type Sale = {
  clientName: string
  discount?: string
  discountType: string
  totalValue: string
}

type ErrorsSale = {
  onFocusClientName: boolean
  clientName: boolean
  onFocusProducts: boolean
  products: boolean
}

type SelectProps = {
  label: string
  value: string
}

type ProductsSelectedProps = Product & {
  max: number
}

const Purchase: NextPage = () => {
  const { push } = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isLargerThan1440] = useMediaQuery('(min-width: 1440px)')

  const [formPurchaseValues, setFormPurchaseValues] = useState<Sale>({ discountType: 'percentage' } as Sale)
  const [products, setProducts] = useState<Product[]>([])
  const [errors, setErrors] = useState<ErrorsSale>()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [productsSelected, setProductsSelected] = useState<ProductsSelectedProps[]>([])
  const [options, setOptions] = useState<SelectProps[]>([])

  const [totalValue, setTotalValue] = useState<number>(0)
  const [totalValueWithDiscount, setTotalValueWithDiscount] = useState<number>(totalValue)

  const [productsData, setProductsData] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false)

  const fetchProducts = async () => {
    setIsLoadingProducts(true)

    try {
      const { status, data } = await api.get<Product[]>('products')

      if (status === 200) {
        setProductsData(data)
        setOptions(
          data.map(product => ({
            value: product._id as string,
            label: `${product.code} - ${product.name} | ${product.color} | ${product.size}`,
          }))
        )
      }
    } catch (error) {
      notify.error('Não foi possível carregar os produtos')
    }

    setIsLoadingProducts(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    if (!errors?.onFocusProducts) return
    //@ts-ignore
    !!products.length ? setErrors({ ...errors, products: false }) : setErrors({ ...errors, products: true })
  }, [products])

  useEffect(() => {
    if (!errors?.onFocusClientName) return

    !!formPurchaseValues?.clientName
      ? //@ts-ignore
        setErrors({ ...errors, clientName: false })
      : //@ts-ignore
        setErrors({ ...errors, clientName: true })
  }, [formPurchaseValues?.clientName])

  useEffect(() => {
    let totalValue = 0

    products.forEach(product => {
      totalValue += Number(product.quantity) * (product.purchaseValue as number)
    })

    products.length >= 1 ? setTotalValue(totalValue) : setTotalValue(0)
  }, [products])

  useEffect(() => {
    let totalValueWithDiscount = totalValue

    if (totalValue && formPurchaseValues?.discount && formPurchaseValues.discountType === 'percentage') {
      const percentage = Number(formPurchaseValues?.discount) / 100
      const discount = percentage * totalValue

      totalValueWithDiscount = totalValue - discount
    } else if (totalValue && formPurchaseValues?.discount && formPurchaseValues.discountType === 'money') {
      totalValueWithDiscount = totalValue - Number(formPurchaseValues?.discount)
    }

    setTotalValueWithDiscount(totalValueWithDiscount)
  }, [formPurchaseValues?.discount, totalValue, formPurchaseValues])

  const handleAddProducts = () => {
    //@ts-ignore
    setErrors({ ...errors, onFocusProducts: true })

    setProducts([...products, ...productsSelected])
    onClose()
    setProductsSelected([])
  }

  const handleInputPurchaseChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target

    setFormPurchaseValues({
      ...formPurchaseValues,
      [name]: name === 'discount' ? Number(value.toString().replace(/\D/, '')) : value,
    })
  }

  const handleSelect = ({ value }: SelectProps) => {
    const productSelected = productsData.find(product => product._id === value)

    if (productSelected) {
      setProductsSelected([...productsSelected, { ...productSelected, max: productSelected.quantity }])
      setOptions(options.filter(option => option.value !== value))
    }
  }

  const handleRemoveProductSelected = (id: string) => {
    const product = productsData.find(product => product._id === id)

    if (product) {
      setOptions([
        ...options,
        {
          value: product._id as string,
          label: `${product.code} - ${product.name} | ${product.color} | ${product.size}`,
        },
      ])
      setProductsSelected(productsSelected.filter(productSelected => productSelected._id !== id))
    }
  }

  const handleRemoveProduct = (id: string) => {
    const product = productsData.find(product => product._id === id)

    if (product) {
      setOptions([
        ...options,
        {
          value: product._id as string,
          label: `${product.code} - ${product.name} | ${product.color} | ${product.size}`,
        },
      ])
      setProducts(products.filter(product => product._id !== id))
    }
  }

  const handleQuantityProduct = (id: string, quantity: number) => {
    setProductsSelected(productsSelected.map(product => (product._id === id ? { ...product, quantity } : product)))
  }

  const onSubmit = async () => {
    if (!products.length) {
      //@ts-ignore
      setErrors({ ...errors, products: true })
      return
    }

    if (!formPurchaseValues?.clientName) {
      //@ts-ignore
      setErrors({ ...errors, clientName: true })
      return
    }

    setIsLoading(true)

    const productsSale = products.map(product => ({
      id: product._id,
      quantity: product.quantity,
      unitPrice: product.saleValue,
    }))

    const dataToSend = {
      productsSale,
      totalValue: totalValueWithDiscount,
      discount: formPurchaseValues.discount,
      discountType: formPurchaseValues.discountType,
      clientName: formPurchaseValues.clientName,
    }

    try {
      const { status } = await api.post('sales', dataToSend)

      if (status !== 201) {
        notify.error('Não foi possível cadastrar Venda!')
        setIsLoading(false)
        return
      }

      setProducts([])
      setProductsSelected([])
      setOptions(
        productsData.map(product => ({
          value: product._id as string,
          label: `${product.code} - ${product.name} | ${product.color} | ${product.size}`,
        }))
      )
      setFormPurchaseValues({ discountType: 'percentage' } as Sale)
      setErrors({ products: false, clientName: false, onFocusClientName: false, onFocusProducts: false })

      notify.success('Venda cadastrada com sucesso! Ir para Home?', { onClick: () => push('/') })
    } catch (error) {
      notify.error('Não foi possível cadastrar Venda!')
    }

    setIsLoading(false)
  }

  return (
    <Flex>
      <Sidebar />

      <Flex w="full" h="100vh" bg="gray.100" direction="column" maxW="calc(100vw - 5rem)">
        <Box px={16} py={4} boxShadow="md" bg="blue.400" color="white" position="relative">
          <Heading>Vendas</Heading>
        </Box>

        <Flex
          direction={isLargerThan1440 ? 'row' : 'column'}
          gap={isLargerThan1440 ? 8 : 4}
          rounded={6}
          bg="white"
          flex={1}
          p={10}
          m={8}
        >
          <Box w="full">
            <Flex direction={isLargerThan1440 ? 'column' : 'row'} gap={isLargerThan1440 ? 0 : 4}>
              <FormControl isInvalid={errors?.clientName}>
                <FormLabel htmlFor="clientName">Nome do Cliente</FormLabel>

                <Input
                  type="text"
                  name="clientName"
                  value={formPurchaseValues?.clientName || ''}
                  onChange={handleInputPurchaseChange}
                  onBlur={() => {
                    //@ts-ignore
                    setErrors({ ...errors, onFocusClientName: true })
                  }}
                />

                <FormErrorMessage>O campo nome do cliente é obrigatório</FormErrorMessage>
              </FormControl>

              <FormControl my={isLargerThan1440 ? 4 : 0}>
                <FormLabel htmlFor="discount">Desconto</FormLabel>

                <Flex gap={4}>
                  <SelectChakra
                    name="discount"
                    onChange={event =>
                      setFormPurchaseValues({ ...formPurchaseValues, discountType: event.target.value })
                    }
                    value={formPurchaseValues?.discountType || 'percentage'}
                  >
                    <option value="percentage">Porcentagem</option>
                    <option value="money">Dinheiro</option>
                  </SelectChakra>

                  <Input
                    w={isLargerThan1440 ? '50%' : 40}
                    type="text"
                    name="discount"
                    value={formPurchaseValues?.discount || ''}
                    onChange={handleInputPurchaseChange}
                  />
                </Flex>
              </FormControl>
            </Flex>

            <Flex direction={isLargerThan1440 ? 'column' : 'row'} gap={isLargerThan1440 ? 0 : 4}>
              <FormControl>
                <FormLabel htmlFor="totalValue">Valor total</FormLabel>

                <Input disabled type="text" name="totalValue" value={totalValue === 0 ? 0 : formatPrice(totalValue)} />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="totalValue">Valor total com Desconto</FormLabel>

                <Input
                  disabled
                  type="text"
                  name="totalValue"
                  value={totalValueWithDiscount === 0 ? 0 : formatPrice(totalValueWithDiscount)}
                />
              </FormControl>
            </Flex>
          </Box>

          <Divider orientation={isLargerThan1440 ? 'vertical' : 'horizontal'} />

          <Box w="full">
            <Flex justifyContent="space-between" mb={4}>
              <FormControl isInvalid={errors?.products}>
                <Text fontSize={24} fontWeight="semibold">
                  Produtos
                </Text>

                <FormErrorMessage>Selecionar no mínimo um produto para concluir</FormErrorMessage>
              </FormControl>
              <Button
                w="19rem"
                variant="outline"
                rightIcon={<BsFileEarmarkPlusFill size={20} />}
                colorScheme="blue"
                onClick={onOpen}
              >
                Selecionar Produtos
              </Button>
            </Flex>

            <Flex
              direction="column"
              justifyContent="space-between"
              h={isLargerThan1440 ? 'calc(100vh - 17rem)' : 'calc(100vh - 28rem)'}
            >
              <Box
                overflow="scroll"
                pr={2}
                pb={2}
                sx={{
                  '::-webkit-scrollbar': {
                    width: '6px',
                    height: '6px',
                  },
                  '::-webkit-scrollbar-thumb': {
                    borderRadius: '10px',
                    backgroundClip: 'padding-box',
                    background: '#a7a9b3',
                  },
                }}
              >
                <Table variant="striped" colorScheme="blue" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Código</Th>
                      <Th>Nome</Th>
                      <Th>Cor</Th>
                      <Th>
                        <Tooltip placement="top" label="Quantidade">
                          Qtd
                        </Tooltip>
                      </Th>
                      <Th isNumeric>Tamanho</Th>
                      <Th isNumeric>
                        <Tooltip placement="top" label="Valor de Compra">
                          VC
                        </Tooltip>
                      </Th>
                      <Th isNumeric>
                        <Tooltip placement="top" label="Valor de Venda">
                          VV
                        </Tooltip>
                      </Th>
                      <Th isNumeric>Remover</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {products.map((product, index) => (
                      <Tr key={index}>
                        <Td>{product.code}</Td>
                        <Td>{product.name}</Td>
                        <Td>{product.color}</Td>
                        <Td>{product.quantity}</Td>
                        <Td isNumeric>{product.size}</Td>
                        <Td isNumeric>{formatPrice(product.purchaseValue as number)}</Td>
                        <Td isNumeric>{formatPrice(product.saleValue as number)}</Td>
                        <Td>
                          <Flex
                            justifyContent="center"
                            cursor="pointer"
                            color="#000243bc"
                            onClick={() => handleRemoveProduct(product._id as string)}
                            _hover={{ color: '#000243' }}
                          >
                            <IoIosRemoveCircle size={18} />
                          </Flex>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>

              <Button
                alignSelf="flex-end"
                rightIcon={<HiArrowSmRight />}
                colorScheme="blue"
                w="20rem"
                onClick={onSubmit}
                isLoading={isLoading}
              >
                Concluir
              </Button>
            </Flex>
          </Box>
        </Flex>
      </Flex>

      <Modal onClose={onClose} size="2xl" isOpen={isOpen}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize={30}>Selecione o Produto</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex gap={4} direction="column" mb={8}>
              {/* @ts-ignore */}
              <Select onChange={handleSelect} options={options} isLoading={isLoadingProducts} />
            </Flex>

            <Box
              overflow="scroll"
              h="60vh"
              pr={2}
              pb={2}
              sx={{
                '::-webkit-scrollbar': {
                  width: '6px',
                  height: '6px',
                },
                '::-webkit-scrollbar-thumb': {
                  borderRadius: '10px',
                  backgroundClip: 'padding-box',
                  background: '#a7a9b3',
                },
              }}
            >
              {productsSelected.map((product, index) => (
                <Flex
                  key={index}
                  rounded={6}
                  bg={index % 2 === 0 ? '#EBF8FF' : 'white'}
                  outline={index % 2 !== 0 ? '2px solid #EBF8FF' : '2px solid white'}
                  justifyContent="space-between"
                  mb={index !== productsSelected.length - 1 ? 4 : 0}
                  px={4}
                  py={2}
                >
                  <Flex direction="column" w="full" mr={8} justifyContent="center">
                    <Flex justifyContent="space-between">
                      <Text>
                        <strong>Produto:</strong> {product.code} - {product.name}
                      </Text>
                      <Text>
                        <strong>VC: </strong>
                        {formatPrice(product.purchaseValue as number)}
                      </Text>
                    </Flex>
                    <Flex justifyContent="space-between">
                      <Text>
                        <strong>Tamanho:</strong> {product.size} - <strong>Cor:</strong> {product.color}
                      </Text>
                      <Text>
                        <strong>VV: </strong>
                        {formatPrice(product.saleValue as number)}
                      </Text>
                    </Flex>
                  </Flex>

                  <Flex>
                    <Flex direction="column" alignItems="center">
                      <Text>Quantidade</Text>
                      <InputNumber max={product.max} id={product._id as string} onChange={handleQuantityProduct} />
                    </Flex>

                    <Box
                      bg="facebook.500"
                      ml={4}
                      mr={-4}
                      my={-2}
                      w={10}
                      borderRightRadius={6}
                      color="white"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      fontSize={40}
                      cursor="pointer"
                      _hover={{ opacity: 0.8 }}
                      onClick={() => handleRemoveProductSelected(product._id as string)}
                    >
                      <FiTrash2 size={22} strokeWidth={1.6} />
                    </Box>
                  </Flex>
                </Flex>
              ))}
            </Box>
          </ModalBody>
          <ModalFooter>
            <Flex w="full" gap={4}>
              <Button onClick={onClose} flexGrow={1} colorScheme="red" variant="outline">
                Cancelar
              </Button>
              <Button onClick={handleAddProducts} flexGrow={1} colorScheme="blue">
                Concluir
              </Button>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

export default Purchase
