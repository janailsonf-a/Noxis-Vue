import axios from 'axios'

const api = axios.create({
baseURL: 'http://192.168.0.162:9102',
  timeout: 10000,
})

export default api