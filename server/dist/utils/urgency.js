"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateUrgency = void 0;
// Simple rules-based urgency scoring
const calculateUrgency = (title, description, category) => {
    let score = 0;
    const text = (title + ' ' + description).toLowerCase();
    // Keyword weights
    const highKeywords = ['fire', 'gun', 'blood', 'accident', 'dead', 'explosion', 'attack', 'severe', 'critical'];
    const mediumKeywords = ['stuck', 'blocked', 'fight', 'suspicious', 'broken', 'dangerous', 'leak'];
    highKeywords.forEach(word => {
        if (text.includes(word))
            score += 30;
    });
    mediumKeywords.forEach(word => {
        if (text.includes(word))
            score += 10;
    });
    // Category weights
    if (category === 'crime')
        score += 20;
    if (category === 'scary-animal')
        score += 15; // Example
    if (category === 'roads')
        score += 5;
    let level = 'low';
    if (score >= 40)
        level = 'high';
    else if (score >= 20)
        level = 'medium';
    return { score, level };
};
exports.calculateUrgency = calculateUrgency;
