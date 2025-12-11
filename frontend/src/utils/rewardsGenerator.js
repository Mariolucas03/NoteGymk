// Genera la configuración de cualquier día (1 al 365)
export const getRewardForDay = (day) => {
    let type = 'normal'; // normal, rare, epic
    let coins = 50;
    let xp = 25;
    let lives = 0;
    let label = 'Recompensa Diaria';

    // Cada 30 días (Mes): MEGA PREMIO
    if (day % 30 === 0) {
        type = 'epic';
        coins = 500;
        xp = 200;
        lives = 1;
        label = '¡Cofre Mensual!';
    }
    // Cada 7 días (Semana): PREMIO GRANDE
    else if (day % 7 === 0) {
        type = 'rare';
        coins = 150;
        xp = 100;
        label = 'Bonus Semanal';
    }
    // Días normales: Incremento progresivo leve
    else {
        // Un poco más cada día que pasa
        coins += day;
    }

    return { day, type, coins, xp, lives, label };
};