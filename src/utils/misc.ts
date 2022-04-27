import { toast, ToastOptions } from 'react-toastify'

const formatPrice = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const masker = {
  price: (value: string | number) => {
    return value
      .toString()
      .replace(/\D/g, '')
      .replace(/(\d*)/, valueRegex => {
        const value = Number(valueRegex).toString()

        if (value === '0' || !value) {
          return ''
        }

        if (value.length === 1) {
          return `0,0${value}`
        }

        if (value.length === 2) {
          return `0,${value}`
        }

        return value
          .replace(/(\d+)(\d{2})/, '$1,$2')
          .replace(/^(\d+)(\d{3})/, '$1.$2')
          .replace(/^(\d+)(\d{3})/, '$1.$2')
          .replace(/\d+?(\d{3}\.\d{3}\.\d{3},\d{2})/, '$1')
      })
  },
}

const onlyNumbers = (value: string | number) => Number(value.toString().replace(/\D/g, ''))

const onlyNumbersWithDecimal = (valueUnformat: string | number) => {
  const value = valueUnformat.toString()

  if (value === '0' || !value) {
    return 0
  }

  if (value.length <= 2) {
    return Number(value.replace(',', '.'))
  }

  return Number(value.replace(/\./g, '').replace(/,/g, '.'))
}

const notify = {
  success: (message: string, options?: ToastOptions<{}>) => toast.success(message, options),
  error: (message: string, options?: ToastOptions<{}>) => toast.error(message, options),
}

interface ObjectTrim {
  [key: string]: unknown
}

const trimObject = <T>(object: ObjectTrim, values: unknown[] = [undefined, null, '']): T => {
  const newObject = {}

  for (const key of Object.keys(object)) {
    if (values.indexOf(object[key]) === -1) {
      ;(newObject as ObjectTrim)[key] = object[key]
    }
  }

  return newObject as T
}

export { formatPrice, masker, onlyNumbers, onlyNumbersWithDecimal, notify, trimObject }
