import axios from "axios"

const $host = axios.create({
    withCredentials: true,
    baseURL: 'http://localhost:8001/' //для local
    //baseURL: 'http://94.228.126.26:8001/' // для server
})

$host.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`
    return config;
})

$host.interceptors.response.use(config => 
    {
       return config
    }, async(error)=> {
        const originalRequest = error.config;
        if (error.response.status === 401 && error.config && !error.config._isRetry) {
            originalRequest._isRetry = true;
            try {
                const response = await axios.get('http://localhost:8000/api/auth/refresh', {withCredentials: true})
                localStorage.setItem('token', response.data.accessToken);
                return $host.request(originalRequest);
            } catch (e) {
                console.log('НЕ АВТОРИЗОВАН по refresh')
            }
        }
        throw error;
      }
)


export { $host }