
"use client"

import { useEffect, useState } from 'react';
import { Container, Typography, List, ListItem, ListItemText, Button } from '@mui/material';
import { getPublicEvents } from '@/services/eventHandling';

const PublicEventListPage = () => {
  const [events, setEvents] = useState<any>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPublicEvents();
  }, []);

  const fetchPublicEvents = async () => {
    setLoading(true);
    try {
      var data: any[] = [];
      var something = await getPublicEvents();
      console.log(something)
      if (something.status == 200) {
        data = something.data
      }
      setEvents(data);
    } catch (error) {
      console.error('Error fetching public events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString: string): string => {
    if (dateTimeString) {
      const utcDateTime = new Date(dateTimeString);

      const timeZoneOffset = utcDateTime.getTimezoneOffset();

      const localDateTime = new Date(utcDateTime.getTime() - timeZoneOffset * 60000);

      return `${localDateTime.toLocaleDateString()} ${localDateTime.toLocaleTimeString()}`;
    }
    return "";
  };



  return (
    <Container maxWidth="md" sx={{ mt: 8, backgroundColor: "white", padding: 4 }}>
      <Typography color="black" variant="h4" align="center" gutterBottom>
        Public Event List
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={fetchPublicEvents}
        disabled={loading}
        fullWidth
        sx={{ mb: 2 }}
      >
        {loading ? 'Refreshing...' : 'Refresh'}
      </Button>
      {events.length > 0 ? (
        <List>
          {events.map((event: any) => (
            <ListItem key={event.id}>
              <ListItemText
                primary={`Event ID: ${event.id}`}
                secondary={`Creator: ${event.creator}, Date: ${formatDateTime(event.datetime)}, Skill Level: ${event.recommendedskilllevel}, Location: ${event.location}`}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography color="black" variant="body1" align="center">
          No public events available.
        </Typography>
      )}
    </Container>
  );
}

export default PublicEventListPage;

