// Calcula la recompensa para un día específico (1, 2, 5, 100...)
export const getRewardForDay = (day) => {
    let type = 'normal';
    let coins = 50;
    let xp = 20;
    let icon = '💰';

    // Lógica: Cada día suma un poco más
    // Día 7, 14, 21... (Semanal): Premio Raro
    if (day % 7 === 0) {
        type = 'rare';
        coins = 150;
        xp = 100;
        icon = '🎁';
    }
    // Día 30, 60... (Mensual): Premio Épico
    else if (day % 30 === 0) {
        type = 'epic';
        coins = 500;
        xp = 250;
        icon = '👑';
    }
    // Días normales
    else {
        // Un pequeño incremento cada día para motivar
        coins += (day * 2);
        xp += day;
    }

    return { day, type, coins, xp, icon };
};