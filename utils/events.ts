import { EventEmitter } from 'events';

export const caregiverEvents = new EventEmitter();

export const openAddCaregiverSheet = () => {
    caregiverEvents.emit('openAddCaregiverSheet');
};

export const closeAddCaregiverSheet = () => {
    caregiverEvents.emit('closeAddCaregiverSheet');
};
