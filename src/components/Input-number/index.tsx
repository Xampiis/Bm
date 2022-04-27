/* eslint-disable react-hooks/exhaustive-deps */
import { Button, HStack, Input, useNumberInput } from '@chakra-ui/react'
import { useEffect } from 'react'

type InputNumberProps = {
  max: number
  id: string
  onChange: (id: string, quantity: number) => void
}

const InputNumber = ({ max, onChange, id }: InputNumberProps) => {
  const { getInputProps, getIncrementButtonProps, getDecrementButtonProps, value } = useNumberInput({
    step: 1,
    defaultValue: max,
    min: 1,
    max: max,
  })

  const inc = getIncrementButtonProps()
  const dec = getDecrementButtonProps()
  const input = getInputProps()

  useEffect(() => {
    onChange(id, Number(value))
  }, [value])

  return (
    <HStack width={180}>
      <Button colorScheme="facebook" {...dec}>
        -
      </Button>
      <Input isReadOnly {...input} />
      <Button colorScheme="facebook" {...inc}>
        +
      </Button>
    </HStack>
  )
}

export default InputNumber
