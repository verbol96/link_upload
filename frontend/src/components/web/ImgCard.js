import {Card, Button} from 'react-bootstrap'
import './style.css'

export const ImgCard = ({image, deleteImg}) =>{


    return(
        <Card className='cardFile' style={{width: '10%', overflow: 'hidden', margin: 10}}>
            <Card.Img variant="top" style={{height: 100, objectFit:'cover'}}  src={image.imageUrl.toString()} />
            <Button variant='light' size='sm' onClick={()=>deleteImg(image)}>X</Button>
           
        </Card>
    )
}