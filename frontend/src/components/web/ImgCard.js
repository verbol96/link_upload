import {Card, Button} from 'react-bootstrap'
import './style.css'

export const ImgCard = ({image, deleteImg}) =>{
  

    return(
        <Card className="cardFile">
          <div className="cardFileInner">
            <Card.Img
              variant="top"
              className="cardImage"
              src={image.imageUrl.toString()}
            />
            <Button
              variant="light"
              size="sm"
              className="closeButton"
              onClick={() => deleteImg(image)}
            > 
            <i className="bi bi-x-circle-fill" ></i>
            </Button>
          </div>
        </Card>
    )
}