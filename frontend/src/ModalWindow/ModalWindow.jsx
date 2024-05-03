import React from 'react'
import "/home/bulba/Desktop/fullStack/frontend/src/ModalWindow/ModalWindow.css"

const ModalWindow = ({active, setActive, children}) =>{
     return (
           <div className={active ? "modal-window active": "modal-window"} onClick={()=>setActive(false)}>
                <div className={active ? "modal-window-content active": "modal-window-content"} onClick={e=>e.stopPropagation()}>
                      {children}
                </div>
           </div>  
     );
};

export default ModalWindow;