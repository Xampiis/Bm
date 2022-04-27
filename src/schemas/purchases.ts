import * as yup from 'yup'

export const PurchaseSchema = yup
  .object()
  .shape({
    locale: yup.string().trim().required('O campo local é obrigatório'),
    date: yup.date().typeError('O campo data é obrigatório').required('O campo data é obrigatório'),
    totalValue: yup.string().nullable(),
    products: yup.array().of(
      yup.object().shape({
        code: yup.string().trim().typeError('Apenas números no campo código').required('O campo código é obrigatório'),
        name: yup.string().trim().required('O campo nome é obrigatório'),
        color: yup.string().trim().required('O campo cor é obrigatório'),
        quantity: yup
          .number()
          .min(1, 'No mínimo 1 unidade.')
          .typeError('O campo quantidade é obrigatório')
          .required('O campo quantidade é obrigatório'),
        size: yup.string().trim().required('O campo tamanho é obrigatório'),
        purchaseValue: yup
          .string()
          .typeError('O campo valor de compra é obrigatório')
          .required('O campo valor de compra é obrigatório'),
        saleValue: yup
          .string()
          .typeError('O campo valor de venda é obrigatório')
          .required('O campo valor de venda é obrigatório'),
      })
    ),
  })
  .required()
