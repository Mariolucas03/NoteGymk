import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config';

export default function Tienda() {
    const { user, setUser } = useUser();
    const [items] = useState([
        { id: 1, name: 'Espada de Plata', cost: 100 },
        { id: 2, name: 'Escudo de Hierro', cost: 80 },
        { id: 3, name: 'Poción de Salud', cost: 30 },
        { id: 4, name: 'Casco de Hierro', cost: 70 },
        { id: 5, name: 'Botas Rápidas', cost: 50 },
        { id: 6, name: 'Amuleto de XP', cost: 150 }
    ]);

    const buy = async (item) => {
        if ((user.coins || 0) < item.cost) { alert('No tienes suficientes monedas'); return; }
        setUser(prev => ({ ...prev, coins: (prev.coins || 0) - item.cost }));
        const date = new Date().toISOString().split('T')[0];
        const body = { date, type: 'compra', item: item.name, cost: item.cost };
        try {
            await fetch(`${API_BASE_URL}/user/${user.id}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            alert('Compra realizada');
        } catch (e) { console.error(e); alert('No se pudo registrar la compra'); }
    };

    return (
        <section>
            <h3 className="font-bold">Tienda</h3>
            <div className="mt-2">Monedas: {user.coins}</div>
            <div className="grid grid-cols-2 gap-3 mt-3">
                {items.map(it => (
                    <div key={it.id} className="border p-3 rounded">
                        <div className="font-semibold">{it.name}</div>
                        <div>Costo: {it.cost} 💰</div>
                        <button className="mt-2 p-2 bg-blue-500 text-white rounded" onClick={() => buy(it)}>Comprar</button>
                    </div>
                ))}
            </div>
        </section>
    );
}
