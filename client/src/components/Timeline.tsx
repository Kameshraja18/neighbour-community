import { format } from 'date-fns';
import { CheckCircle, AlertCircle, Clock, MessageSquare } from 'lucide-react';

interface TimelineProps {
    history: any[];
    notes: any[];
}

const Timeline = ({ history, notes }: TimelineProps) => {
    // Combine flexibility: History events + Official notes
    // Simple sorted list
    const events = [
        ...history.map(h => ({ ...h, type: 'history' })),
        ...notes.filter(n => !n.isOfficial).map(n => ({ ...n, type: 'comment', action: 'comment_added' }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const getIcon = (action: string) => {
        if (action.includes('created')) return <AlertCircle className="h-5 w-5 text-blue-500" />;
        if (action.includes('resolved')) return <CheckCircle className="h-5 w-5 text-green-500" />;
        if (action.includes('rejected')) return <AlertCircle className="h-5 w-5 text-red-500" />;
        if (action.includes('comment')) return <MessageSquare className="h-5 w-5 text-gray-400" />;
        return <Clock className="h-5 w-5 text-amber-500" />;
    };

    return (
        <div className="flow-root">
            <ul className="-mb-8">
                {events.map((event, eventIdx) => (
                    <li key={event._id || eventIdx}>
                        <div className="relative pb-8">
                            {eventIdx !== events.length - 1 ? (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                                <div className="bg-white rounded-full p-1 border border-gray-200 shadow-sm">
                                    {getIcon(event.action)}
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            {event.action.replace(/_/g, ' ')}
                                            {event.note && <span className="font-medium text-gray-900">: "{event.note}"</span>}
                                            {event.text && <span className="font-medium text-gray-900">: "{event.text}"</span>}
                                        </p>
                                    </div>
                                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                        <time dateTime={event.timestamp}>{format(new Date(event.timestamp), 'MMM d, h:mm a')}</time>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Timeline;
