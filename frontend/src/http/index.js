import axios from "axios"

const $host = axios.create({
    withCredentials: true,
    //baseURL: 'http://localhost:8002/' //для local
    baseURL: 'https://link1.by:8002/' // для server
})

$host.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
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
                let response = await $host.get('/api/auth/refresh', { withCredentials: true });
                if(response.data==='error_refresh') localStorage.removeItem('token');
                else localStorage.setItem('token', response.data.accessToken);
                return $host.request(originalRequest);
            } catch (e) {
                localStorage.removeItem('token')
                console.log('НЕ АВТОРИЗОВАН по refresh')
            }
        }
        throw error;
      }
)


export { $host }