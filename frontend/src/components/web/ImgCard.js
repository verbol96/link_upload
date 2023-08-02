import {Card} from 'react-bootstrap'
import './style.css'

export const ImgCard = ({image, deleteImg}) =>{
  

    return(
        <div className="cardFile"> 
          <div className="cardFileInner">
            <Card.Img
              variant="top"
              className="cardImage"
              src={image.imageUrl.toString()}
            />
            <button
              variant="light"
              size="sm"
              className="closeButton"
              onClick={() => deleteImg(image)}
            > 
            <i className="bi bi-x-circle-fill" ></i>
            </button>
          </div>
        </div>
    )
}