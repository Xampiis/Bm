import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
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
} from '@chakra-ui/react'
import type { NextPage } from 'next'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { BsFileEarmarkPlusFill } from 'react-icons/bs'
import Sidebar from '../../components/Sidebar'
import { formatPrice, masker, notify, onlyNumbers, onlyNumbersWithDecimal } from '../../utils/misc'
import { HiArrowSmRight } from 'react-icons/hi'
import { api } from '../../services/api'
import { useForm, SubmitHandler, useFieldArray } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useRouter } from 'next/router'
import { PurchaseSchema } from '../../schemas/purchases'
import { DEFAULT_PRODUCT } from '../../constants/purchases'
import { Purchase } from '../../types/purchase'
import { Product } from '../../types/product'

const Purchase: NextPage = () => {
  const { push } = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isLargerThan1440] = useMediaQuery('(min-width: 1440px)')

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const {
    setValue,
    handleSubmit,
    register,
    formState: { errors },
    watch,
    clearErrors,
    trigger,
    control,
    reset,
  } = useForm<Purchase>({
    resolver: yupResolver(PurchaseSchema),
    defaultValues: {
      locale: '',
      date: new Date().toISOString().split('T')[0],
      totalValue: '0',
      products: [DEFAULT_PRODUCT],
    },
  })

  const { fields, append, remove } = useFieldArray({
    name: 'products',
    control,
  })

  const products = watch('products') as Product[]
  const lastProductNumber = products.length - 1
  const lastProduct = products[lastProductNumber]
  const { purchaseValue, saleValue } = lastProduct

  const isValidLastProduct = async () => await trigger(`products.${lastProductNumber}`)

  const closeModal = async () => {
    onClose()

    const isValid = await isValidLastProduct()

    !isValid && lastProductNumber !== 0 && remove(lastProductNumber)
  }

  const addProduct = async () => {
    const isValid = await isValidLastProduct()

    isValid && onClose()
  }

  const openModal = async () => {
    const isValid = await isValidLastProduct()

    isValid ? append(DEFAULT_PRODUCT) : clearErrors('products')

    onOpen()
  }

  const onSubmit: SubmitHandler<Purchase> = async data => {
    setIsLoading(true)

    const purchase = {
      locale: data.locale,
      date: new Date(data.date).toISOString().split('T')[0],
      totalValue: onlyNumbersWithDecimal(data.totalValue.split(/\s/)[1]),
      products: data?.products?.map(product => ({
        ...product,
        quantity: Number(product.quantity),
        purchaseValue: onlyNumbersWithDecimal(product.purchaseValue),
        saleValue: onlyNumbersWithDecimal(product.saleValue),
      })),
    }

    try {
      const { status } = await api.post('purchases', purchase)

      if (status !== 201) {
        notify.error('Não foi possível cadastrar Compra!')
        setIsLoading(false)
        return
      }

      reset()

      notify.success('Compra cadastrada com sucesso! Ir para Home?', { onClick: () => push('/') })
    } catch (error) {
      notify.error('Não foi possível cadastrar Compra!')
    }

    setIsLoading(false)
  }

  const propertiesValues = useCallback(
    () => ({
      lastProductNumber,
      purchaseValue,
      saleValue,
    }),
    [lastProductNumber, purchaseValue, saleValue]
  )

  useEffect(() => {
    const { lastProductNumber, purchaseValue, saleValue } = propertiesValues()

    if (purchaseValue) {
      setValue(`products.${lastProductNumber}.purchaseValue`, masker.price(purchaseValue))
    }

    if (saleValue) {
      setValue(`products.${lastProductNumber}.saleValue`, masker.price(saleValue))
    }
  }, [setValue, watch, propertiesValues])

  useEffect(() => {
    let totalValue = 0

    products?.forEach(product => {
      totalValue += product.quantity ? Number(product.quantity) * onlyNumbersWithDecimal(product.purchaseValue) : 0
    })

    products ? setValue('totalValue', formatPrice(totalValue)) : setValue('totalValue', '0')
  }, [setValue, products, lastProduct.purchaseValue])

  return (
    <Flex>
      <Sidebar />

      <Flex w="full" h="100vh" bg="gray.100" direction="column" maxW="calc(100vw - 5rem)">
        <Box px={16} py={4} boxShadow="md" bg="blue.400" color="white" position="relative">
          <Heading>Compras</Heading>
        </Box>

        <Flex
          m={8}
          p={10}
          flex={1}
          as="form"
          bg="white"
          rounded={6}
          gap={isLargerThan1440 ? 8 : 4}
          onSubmit={handleSubmit(onSubmit)}
          direction={isLargerThan1440 ? 'row' : 'column'}
        >
          <Box w="full">
            <FormControl isInvalid={!!errors.locale}>
              <FormLabel htmlFor="locale">Local</FormLabel>

              <Input {...register('locale')} />

              <FormErrorMessage>{errors.locale?.message}</FormErrorMessage>
            </FormControl>

            <Flex direction={isLargerThan1440 ? 'column' : 'row'} gap={isLargerThan1440 ? 0 : 4}>
              <FormControl my={isLargerThan1440 ? 4 : 0} isInvalid={!!errors.date}>
                <FormLabel htmlFor="date">Data</FormLabel>

                <Input type="date" {...register('date')} />

                <FormErrorMessage>{errors.date?.message}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="totalValue">Valor total</FormLabel>

                <Input disabled type="text" {...register('totalValue')} />
              </FormControl>
            </Flex>
          </Box>

          <Divider orientation={isLargerThan1440 ? 'vertical' : 'horizontal'} />

          <Box w="full">
            <Flex justifyContent="space-between" mb={4}>
              <FormControl isInvalid={!!errors.products}>
                <Text fontSize={24} fontWeight="semibold">
                  Produtos
                </Text>

                <FormErrorMessage mt={-1}>Existem produtos inválidos para concluir</FormErrorMessage>
              </FormControl>

              <Button
                w="19rem"
                onClick={openModal}
                variant="outline"
                colorScheme="blue"
                rightIcon={<BsFileEarmarkPlusFill size={20} />}
              >
                Adicionar Produto
              </Button>
            </Flex>

            <Flex
              direction="column"
              justifyContent="space-between"
              h={isLargerThan1440 ? 'calc(100vh - 17rem)' : 'calc(100vh - 28rem)'}
            >
              <Box
                pr={2}
                pb={2}
                overflow="scroll"
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
                    </Tr>
                  </Thead>
                  <Tbody>
                    {products?.map((product, index) =>
                      product.code ? (
                        <Tr key={index}>
                          <Td>{product.code}</Td>
                          <Td>{product.name}</Td>
                          <Td>{product.color}</Td>
                          <Td>{product.quantity}</Td>
                          <Td isNumeric>{product.size}</Td>
                          <Td isNumeric>{formatPrice(onlyNumbersWithDecimal(product.purchaseValue))}</Td>
                          <Td isNumeric>{formatPrice(onlyNumbersWithDecimal(product.saleValue))}</Td>
                        </Tr>
                      ) : null
                    )}
                  </Tbody>
                </Table>
              </Box>

              <Button
                alignSelf="flex-end"
                rightIcon={<HiArrowSmRight />}
                colorScheme="blue"
                w="20rem"
                type="submit"
                isLoading={isLoading}
              >
                Concluir
              </Button>
            </Flex>
          </Box>
        </Flex>
      </Flex>

      <Modal onClose={closeModal} size="lg" isOpen={isOpen}>
        <ModalOverlay />
        <ModalContent as="form">
          <ModalHeader fontSize={30}>Cadastro de Produto</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {fields.map((field, index, fields) =>
              fields.length - 1 === index ? (
                <Flex gap={4} direction="column" key={field.id}>
                  <FormControl isInvalid={!!errors?.products?.[index]?.code}>
                    <FormLabel htmlFor="code">Código</FormLabel>
                    <Input
                      type="number"
                      onInput={() => trigger(`products.${index}.code`)}
                      {...register(`products.${index}.code` as const)}
                    />
                    <FormErrorMessage>{errors?.products?.[index]?.code?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors?.products?.[index]?.name}>
                    <FormLabel htmlFor="name">Nome</FormLabel>
                    <Input
                      type="text"
                      onInput={() => trigger(`products.${index}.name`)}
                      {...register(`products.${index}.name` as const)}
                    />
                    <FormErrorMessage>{errors?.products?.[index]?.name?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors?.products?.[index]?.color}>
                    <FormLabel htmlFor="color">Cor</FormLabel>
                    <Input
                      type="text"
                      onInput={() => trigger(`products.${index}.color`)}
                      {...register(`products.${index}.color` as const)}
                    />
                    <FormErrorMessage>{errors?.products?.[index]?.color?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors?.products?.[index]?.quantity}>
                    <FormLabel htmlFor="quantity">Quantidade</FormLabel>
                    <Input
                      type="number"
                      onInput={() => trigger(`products.${index}.quantity`)}
                      {...register(`products.${index}.quantity` as const)}
                    />
                    <FormErrorMessage>{errors?.products?.[index]?.quantity?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors?.products?.[index]?.size}>
                    <FormLabel htmlFor="size">Tamanho</FormLabel>
                    <Input
                      type="text"
                      onInput={() => trigger(`products.${index}.size`)}
                      {...register(`products.${index}.size` as const)}
                    />
                    <FormErrorMessage>{errors?.products?.[index]?.size?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors?.products?.[index]?.purchaseValue}>
                    <FormLabel htmlFor="purchaseValue">Valor de Compra</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none" color="gray.600" fontSize="1.2em">
                        R$
                      </InputLeftElement>
                      <Input
                        type="text"
                        onInput={() => trigger(`products.${index}.purchaseValue`)}
                        {...register(`products.${index}.purchaseValue` as const)}
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors?.products?.[index]?.purchaseValue?.message}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors?.products?.[index]?.saleValue}>
                    <FormLabel htmlFor="saleValue">Valor de Venda</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none" color="gray.600" fontSize="1.2em">
                        R$
                      </InputLeftElement>
                      <Input
                        type="text"
                        onInput={() => trigger(`products.${index}.saleValue`)}
                        {...register(`products.${index}.saleValue` as const)}
                      />
                    </InputGroup>
                    <FormErrorMessage>{errors?.products?.[index]?.saleValue?.message}</FormErrorMessage>
                  </FormControl>
                </Flex>
              ) : null
            )}
          </ModalBody>
          <ModalFooter>
            <Flex w="full" gap={4}>
              <Button onClick={closeModal} flexGrow={1} colorScheme="red" variant="outline">
                Cancelar
              </Button>
              <Button onClick={addProduct} flexGrow={1} colorScheme="blue">
                Adicionar
              </Button>
            </Flex>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

export default Purchase
