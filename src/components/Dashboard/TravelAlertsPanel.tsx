import React, { useEffect, useState } from 'react';
import travelAlertsService, {
  type TravelAlert,
  type TravelAlertSubscription,
} from '../../lib/api/travelAlertsService';
import { ALL_COUNTRIES } from '../../utils/countries';

const TravelAlertsPanel: React.FC = () => {
  const [alerts, setAlerts] = useState<TravelAlert[]>([]);
  const [subscriptions, setSubscriptions] = useState<TravelAlertSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [destinationCode, setDestinationCode] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    const [alertRes, subRes] = await Promise.all([
      travelAlertsService.listAlerts(),
      travelAlertsService.listSubscriptions(),
    ]);
    setAlerts(alertRes.alerts);
    setSubscriptions(subRes.subscriptions);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const unreadCount = alerts.filter((a) => !a.read_at).length;

  const handleWatchDestination = async () => {
    if (!destinationCode) return;
    const country = ALL_COUNTRIES.find((c) => c.code === destinationCode);
    const { error } = await travelAlertsService.upsertSubscription({
      destinationCode,
      alertType: 'destination_watch',
      enabled: true,
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    await travelAlertsService.createAlert({
      alertType: 'destination_watch',
      title: `Watching ${country?.name || destinationCode.toUpperCase()}`,
      message: 'You will receive alerts when visa requirements or application updates are relevant.',
      destinationCode,
    });
    setDestinationCode('');
    setMessage('Destination watch added.');
    void load();
  };

  const toggleApplicationUpdates = async (enabled: boolean) => {
    await travelAlertsService.upsertSubscription({
      alertType: 'application_updates',
      enabled,
    });
    void load();
  };

  const appUpdatesEnabled = subscriptions.some(
    (s) => s.alert_type === 'application_updates' && s.enabled
  );

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-semibold">Travel Alerts</h3>
            <p className="text-sm text-gray-500 mt-1">
              Stay informed about visa applications and destinations you follow.
            </p>
          </div>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4">
            <input
              type="checkbox"
              checked={appUpdatesEnabled}
              onChange={(e) => void toggleApplicationUpdates(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600"
            />
            <div>
              <p className="font-medium text-sm">Application status updates</p>
              <p className="text-xs text-gray-500">Notify me when my visa applications change status</p>
            </div>
          </label>

          <div className="rounded-lg border border-gray-200 p-4">
            <p className="font-medium text-sm mb-2">Watch a destination</p>
            <div className="flex gap-2">
              <select
                className="input flex-1 text-sm"
                value={destinationCode}
                onChange={(e) => setDestinationCode(e.target.value)}
              >
                <option value="">Select country</option>
                {ALL_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-primary text-sm px-3"
                onClick={() => void handleWatchDestination()}
                disabled={!destinationCode}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {message && <p className="text-sm text-green-700 mb-4">{message}</p>}

        {loading ? (
          <p className="text-sm text-gray-500">Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            No alerts yet. Enable application updates or watch a destination above.
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 ${
                  alert.read_at ? 'border-gray-200 bg-white' : 'border-primary-200 bg-primary-50/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    {alert.message && (
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!alert.read_at && (
                    <button
                      type="button"
                      className="text-xs text-primary-600 hover:underline shrink-0"
                      onClick={() => {
                        void travelAlertsService.markRead(alert.id).then(() => load());
                      }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {unreadCount > 0 && (
          <button
            type="button"
            className="mt-4 text-sm text-primary-600 hover:underline"
            onClick={() => void travelAlertsService.markAllRead().then(() => load())}
          >
            Mark all as read
          </button>
        )}
      </div>
    </div>
  );
};

export default TravelAlertsPanel;
