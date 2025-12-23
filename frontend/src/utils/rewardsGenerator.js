export const getRewardForDay = (day) => {
    // Lógica visual: Debe coincidir con el backend
    let coins = day; // 1 moneda día 1, 2 día 2...
    let xp = day * 10;

    // Bonus visual del 7º día
    if (day === 7) {
        coins += 5;
        xp += 50;
    }

    return {
        coins,
        xp,
        image: `/assets/rewards/day${day}.png` // (Si usas imágenes)
    };
};