
"use client"
import { deleteEvent, getEventAttendees, getEventInfo, joinEvent, leaveEvent } from '@/services/eventHandling';
import { Box, Button, CircularProgress, Dialog, Paper, Snackbar, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import UpdateGroup from './updateGroup';

const ViewGroup = (props: { groupId: string, open: boolean, handleClose: () => void, getEvents: () => void }) => {
  const [group, setGroup] = useState<any>({});
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [alreadyAttending, setAlreadyAttending] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);

  async function getGroup() {
    setIsLoading(true);
    var response = await getEventInfo(props.groupId)
    if (response.status == 200) {
      var data = response.data;
      data.visibility = data.visibility == 'public' ? 'Public' : 'Private';
      setGroup(response.data)
      console.log(response)
      await checkOwner(response.data);
      await getAttendees(props.groupId);
    }
    setIsLoading(false);
  }

  async function getAttendees(id: string) {
    setAlreadyAttending(false)
    var response = await getEventAttendees(id);
    console.log(response)
    if (response.status == 200) {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        var user = localStorage.getItem('UserData');
        var userData = JSON.parse(user || '{}');
        if (userData.friendcode) {
          for (var i = 0; i < response.data.length; i++) {
            if (userData.friendcode == response.data[i].friendcode) {
              setAlreadyAttending(true)
            }
          }
        }
      }
      setAttendees(response.data)
    }
    setIsLoading(false);
  }

  async function handleDelete() {
    setIsLoading(true);
    if (isOwner) {
      var response = await deleteEvent(props.groupId);
      if (response.status == 200) {
        props.getEvents();
        props.handleClose();
      }
    }
    setIsLoading(false);
  }

  async function checkOwner(data: any) {
    // console.log("check owner")
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      // console.log("window not undefined")
      var user = localStorage.getItem('UserData');
      var userData = JSON.parse(user || '{}');
      // console.log(userData.friendcode, data.creator)
      // console.log();
      if (userData.friendcode && (userData.friendcode as string).trim() == (data.creator as string).trim()) {
        // console.log("is owner")
        setIsOwner(true);
        return;
      } else {
        setIsOwner(false);
        return;
      }
    } else {
      await checkOwner(data);
    }
    setIsOwner(false);
  }

  const formatDateTime = (dateTimeString: string): string => {
    if (dateTimeString) {
      const utcDateTime = new Date(dateTimeString);
      const timeZoneOffset = utcDateTime.getTimezoneOffset();
      const localDateTime = new Date(utcDateTime.getTime() - timeZoneOffset * 60000);
      const options = { timeZone: 'UTC' };
      const timeString = localDateTime.toLocaleString('en-US', options);
      return `${timeString}`;
      // return `${localDateTime.toLocaleDateString()} ${localDateTime.toLocaleTimeString()}`;
    }
    return "";
  };


  const handleJoin = async () => {
    setIsLoading(true);
    console.log("joining")
    console.log(group.id)
    var something = await joinEvent(group.id);
    console.log(something)
    setShowSnackbar(true);
    if (something.status == 200) {
      setSnackbarMessage('Attendance successful!');
      getAttendees(group.id);
      setAlreadyAttending(true)
    } else {
      setSnackbarMessage(something.data.error);
    }

  }

  const handleLeave = async () => {
    setIsLoading(true);
    console.log("leaving")
    var something = await leaveEvent(group.id);
    console.log(something)
    setShowSnackbar(true);
    if (something.status == 200) {
      setSnackbarMessage('Leaving successful!');
      getAttendees(group.id);
      setAlreadyAttending(false)
    } else {
      setSnackbarMessage(something.data.error || something.data.message);
    }
  }

  const handleEdit = async () => {
    setIsLoading(true);
    console.log("edit")
    setOpenUpdate(true)
  }

  useEffect(() => {
    getGroup();
  }, [props.groupId])

  return (
    <Dialog open={props.open} onClose={props.handleClose}>
      {isLoading ?
      <Box sx={{ width: 100, height: 100, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <CircularProgress sx={{ padding: 1 }} />
      </Box>
        :
        <Paper sx={{ padding: 5 }}>
          <Typography variant="h5" gutterBottom>
            Event ID: {group.id}
          </Typography>
          <Typography variant="h6" gutterBottom>
            Name: {group.name}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Location: {group.location}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Recommended Skill Level: {group.recommendedskilllevel}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Date & Time: {formatDateTime(group.datetime)}
          </Typography>
          <Typography variant="body1" gutterBottom>
            Visibility: {group.visibility}
          </Typography>
          <Stack direction="row" justifyContent="space-between" sx={{ padding: 0 }}>

            <Button variant="contained" color="primary" onClick={props.handleClose}>Close</Button>
            {isOwner && <Button color="secondary" onClick={handleDelete}>Delete</Button>}
            {isOwner && <Button color="secondary" onClick={handleEdit}>Edit</Button>}
            {
              alreadyAttending
                ?
                <Button variant="contained" color="primary" onClick={handleLeave}>Leave</Button>
                :
                <Button variant="contained" color="primary" onClick={handleJoin}>Join</Button>
            }
          </Stack>
          <Typography variant="h6" gutterBottom>Attending Skaters:</Typography>
          <Stack direction="column" sx={{ maxHeight: '30vh', overflowY: 'auto' }}>
            {attendees.map((attendee: any) => (
              <Paper sx={{ padding: 1, margin: 1 }} key={attendee.friendcode}>
                <Typography variant="h5" gutterBottom>
                  Username: {attendee.username}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Friend Code: {attendee.friendcode}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Email: {attendee.email}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Home Rink: {attendee.homerink}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Recommended Skill Level: {attendee.skilllevel}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Paper>
      }
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
      />
      <UpdateGroup getEvents={props.getEvents} open={openUpdate} handleClose={() => { setIsLoading(false); setOpenUpdate(false) }} handleSuccessfulClose={() => { setIsLoading(false); setOpenUpdate(false); getGroup(); }} groupId={group.id} group={group} />
    </Dialog>
  );
}

export default ViewGroup;

