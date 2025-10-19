// helper to generate a simple unique id (safe for React Native environments)
export const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

// helper to format any timestamp-like input into a readable date string
export const formatAnyTimestamp = (ts: any): string => {
    if (!ts) return 'N/A';
    let d: Date | null = null;

    if (typeof ts === 'number') {
        d = new Date(ts);
    } else if (ts?.toDate && typeof ts.toDate === 'function') {
        d = ts.toDate();
    } else if (typeof ts === 'string') {
        const parsed = Date.parse(ts);
        if (!isNaN(parsed)) d = new Date(parsed);
    }

    return d
        ? d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
        : 'N/A';
};