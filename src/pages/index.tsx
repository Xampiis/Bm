import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
} from '@chakra-ui/react'
import axios from 'axios'
import type { GetServerSideProps, NextPage } from 'next'
import { ChangeEvent, useEffect, useState } from 'react'
import { AiFillHome } from 'react-icons/ai'
import { ToastContainer } from 'react-toastify'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Sidebar from '../components/Sidebar'
import { api } from '../services/api'
import { notify } from '../utils/misc'

export type DashboardChart = {
  dia: string
  compras: number
  vendas: number
  faturamento: number
}

interface HomeProps {
  data: DashboardChart[]
}

interface GetServerSidePropsResponse {
  props: {
    data: DashboardChart[]
  }
}

const Home: NextPage<HomeProps> = ({ data: serverSideData }) => {
  const date = new Date()
  const mounth = date.getMonth() + 1
  const year = date.getFullYear()
  const [today] = date.toISOString().split('T')

  const [data, setData] = useState<DashboardChart[]>(() => serverSideData)
  const [initalDate, setInitalDate] = useState<string>(() => `${year}-${mounth < 10 ? `0${mounth}` : mounth}-01`)
  const [lastDate, setLastDate] = useState<string>(() => today)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleInitalDate = (e: ChangeEvent<HTMLInputElement>) => {
    setInitalDate(e.target.value)
  }

  const handleLastDate = (e: ChangeEvent<HTMLInputElement>) => {
    setLastDate(e.target.value)
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      const { data } = await api.get('/dashboard', {
        params: {
          initalDate,
          lastDate,
        },
      })

      setData(data)
    } catch (error) {
      notify.error('Não foi possível carregar os dados')
    }

    setIsLoading(false)
  }

  return (
    <Flex flex={1} bg="green">
      <Sidebar />
      <Flex w="100vw" h="100vh" bg="gray.100" direction="column">
        <Box px={16} py={4} boxShadow="md" bg="blue.400" color="white" position="relative">
          <Heading>Home</Heading>
        </Box>

        <Flex m={8} flex={1} bg="white" rounded={6} direction="column" justifyContent="center" alignItems="flex-start">
          <Flex px={8} py={4} gap={4} alignItems="flex-end">
            <FormControl>
              <FormLabel htmlFor="date">A partir do dia:</FormLabel>

              <Input type="date" value={initalDate} onChange={handleInitalDate} />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="date">Até o dia:</FormLabel>

              <Input type="date" value={lastDate} onChange={handleLastDate} />
            </FormControl>

            <Button colorScheme="blue" variant="outline" onClick={handleSubmit} width={60} isLoading={isLoading}>
              Buscar
            </Button>
          </Flex>

          <Flex flex={1} justifyContent="center" width="full" height="full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="compras" stroke="#d88784" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="vendas" stroke="#8295ca" />
                <Line type="monotone" dataKey="faturamento" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

export async function getServerSideProps(): Promise<GetServerSidePropsResponse> {
  try {
    const { data } = await api.get<DashboardChart[] | string>('/dashboard')

    if (typeof data === 'string') {
      return { props: { data: [] } }
    }

    return { props: { data } }
  } catch (error) {
    return { props: { data: [] } }
  }
}

export default Home
