import React from 'react';
import {
    LeadingActions,
    SwipeableList,
    SwipeableListItem,
    SwipeAction,
    TrailingActions
} from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';
import { Check, Trash2, Zap, Coins, Plus } from 'lucide-react';

export default function MissionCard({ mission, onComplete, onDelete, onIncrement }) {

    // Action: Swipe Right (Complete or Increment)
    const leadingActions = () => (
        <LeadingActions>
            <SwipeAction onClick={() => mission.targetValue > 1 ? onIncrement(mission.id) : onComplete(mission.id)}>
                <div className="flex items-center px-4 bg-emerald-500 text-white h-full rounded-l-xl my-1">
                    <Check size={24} />
                    <span className="ml-2 font-bold">{mission.targetValue > 1 ? 'Avanzar' : 'Completar'}</span>
                </div>
            </SwipeAction>
        </LeadingActions>
    );

    // Action: Swipe Left (Delete)
    const trailingActions = () => (
        <TrailingActions>
            <SwipeAction destructive={true} onClick={() => onDelete(mission.id)}>
                <div className="flex items-center justify-end px-4 bg-red-500 text-white h-full rounded-r-xl my-1">
                    <span className="mr-2 font-bold">Borrar</span>
                    <Trash2 size={24} />
                </div>
            </SwipeAction>
        </TrailingActions>
    );

    return (
        <div className="mb-3 select-none">
            <SwipeableList threshold={0.25} type="ios">
                <SwipeableListItem
                    leadingActions={!mission.isCompleted ? leadingActions() : null}
                    trailingActions={trailingActions()}
                >
                    <div className={`w-full bg-slate-800 border border-slate-700 p-4 rounded-xl shadow-sm flex items-center justify-between transition-all ${mission.isCompleted ? 'opacity-50 grayscale' : 'opacity-100'
                        }`}>

                        {/* Mission Info */}
                        <div className="flex flex-col gap-1 flex-1 mr-2">
                            <h3 className={`font-bold text-slate-100 ${mission.isCompleted ? 'line-through text-slate-400' : ''}`}>
                                {mission.name}
                            </h3>

                            <div className="flex items-center gap-2 text-xs mt-1">
                                <span className={`px-2 py-0.5 rounded-full border ${mission.frequency === 'daily'
                                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                    : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                    }`}>
                                    {mission.frequency === 'daily' ? 'DIARIA' :
                                        mission.frequency === 'weekly' ? 'SEMANAL' :
                                            mission.frequency === 'monthly' ? 'MENSUAL' : 'ANUAL'}
                                </span>
                            </div>

                            {/* Progress Bar (Moved Below Frequency) */}
                            {mission.targetValue > 1 && (
                                <div className="w-full mt-2">
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                        <span>Progreso</span>
                                        <span>{mission.currentValue || 0} / {mission.targetValue}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                                        <div
                                            className="h-full bg-violet-500 transition-all duration-300"
                                            style={{ width: `${Math.min(((mission.currentValue || 0) / mission.targetValue) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions & Rewards */}
                        <div className="flex items-center gap-3">
                            {/* Rewards */}
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1 text-violet-400 font-bold text-sm">
                                    <span>+{mission.xpReward} XP</span>
                                    <Zap size={14} fill="currentColor" />
                                </div>
                                <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                                    <span>+{mission.coinReward}</span>
                                    <Coins size={14} fill="currentColor" />
                                </div>
                            </div>
                        </div>

                    </div>
                </SwipeableListItem>
            </SwipeableList>
        </div>
    );
}
