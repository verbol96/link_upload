import axios from "axios"

const $host = axios.create({
    withCredentials: true,
    baseURL: 'http://localhost:8001/' //для local
    //baseURL: 'http://85.193.91.221:8001/' // для server
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
                const response = await axios.get('http://localhost:8001/api/auth/refresh', {withCredentials: true})
            
                if(response.data==='error_refresh') localStorage.removeItem('token');
                else localStorage.setItem('token', response.data.accessToken);
                return $host.request(originalRequest);
            } catch (e) {
                console.log('НЕ АВТОРИЗОВАН по refresh')
            }
            
        }
        
        
        throw error;
      }
)


export { $host }