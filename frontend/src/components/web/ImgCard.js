import {Card, Button} from 'react-bootstrap'
import './style.css'

export const ImgCard = ({image, deleteImg}) =>{


    return(
        <Card className='cardFile' style={{width: '15%', overflow: 'hidden', margin: 10}}>
            <Card.Img variant="top" style={{height: 200, objectFit:'cover'}}  src={image.imageUrl.toString()} />
            <Button variant='light' onClick={()=>deleteImg(image.id)}>X</Button>
           
        </Card>
    )
}