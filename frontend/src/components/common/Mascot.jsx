import React from 'react';
import './Mascot.css';
// Asegúrate de que esta ruta apunte a tu imagen del dragón rojo
import dragonSprite from '../../assets/dragon.png';

const Mascot = () => {
    return (
        <div className="mascot-container">
            <div
                className="mascot-character"
                style={{ backgroundImage: `url(${dragonSprite})` }}
            ></div>
        </div>
    );
};

export default Mascot;