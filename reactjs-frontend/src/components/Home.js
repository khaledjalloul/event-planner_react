import React, { useEffect, useState } from 'react'
import Loader from "react-loader-spinner";
import { useNavigate } from "react-router-dom"
import { MdLocationOn, MdDateRange, MdAccessTime } from "react-icons/md";

const EventCard = (props) => {
    const navigate = useNavigate()
    const dateTime = new Date(props.data.dateTime)
    return (
        <div className="cardDiv" onClick={() => { navigate('/event-planner_react/eventDetails', { state: { data: props.data } }) }}>
            <img src={props.data.image} className="cardImage" alt={props.data.title} />
            <div className="cardInfoDiv">
                <p style={{ fontWeight: 'bold', alignSelf: 'center' }}>{props.data.title}</p>
                <div style={{ width: '70%', borderTop: 'solid 2px black', alignSelf: 'center', marginTop: '10px', marginBottom: '10px' }} />
                <div className='cardInfoSubDiv'>
                    <p><MdLocationOn style={{ marginRight: '4px' }} /> {props.data.eventLocation}</p>
                    <p><MdDateRange style={{ marginRight: '4px' }} /> {dateTime.toLocaleDateString()}</p>
                    <p><MdAccessTime style={{ marginRight: '4px' }} /> {dateTime.toLocaleTimeString()}</p>
                </div>
            </div>
        </div>
    )
}

const Home = (props) => {
    const [loading, setLoading] = useState(true)
    const [events, setEvents] = useState([])
    const [searchID, setSearchID] = useState()

    const navigate = useNavigate()

    useEffect(() => {
        fetch(props.APIURL + '/getEvents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: JSON.parse(localStorage.getItem('token')).username }) })
            .then(res => res.json())
            .then((result) => {
                setEvents(result)
                setLoading(false)
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    var eventCards = events.map(event =>
        <EventCard
            key={event._id}
            data={{
                _id: event._id,
                title: event.title,
                eventLocation: event.eventLocation,
                dateTime: event.dateTime,
                description: event.description,
                attendees: event.attendees,
                items: event.items,
                image: event.image,
                creator: event.creator
            }}
            APIURL={props.APIURL}
        />)

    const searchForEvent = async () => {
        fetch(props.APIURL + '/getEventByID', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: searchID })
        }).then(res => res.json())
            .then(data => {

                if (data.status === 'success') navigate('/event-planner_react/eventDetails', { state: { data: data.result } })
            })
    }

    return (
        loading ?
            <div style={{ width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader type="TailSpin" color="#004b7d" height='10vh' width='15vw' />
            </div>
            :
            eventCards.length === 0 ?
                <div>
                <div className='searchEventDiv' style={{ width: '100vw', height:'100%' }}>
                    <p style={{ fontFamily: 'Helvetica' }}>You're not attending any events. Join one by pasting its ID below.</p>
                    <div className='searchEventSubDiv' style={{ marginTop: '20px' }}>
                        <input type='text' placeholder='Event ID' onChange={e => setSearchID(e.target.value)} /><input type='button' value='Search' onClick={searchForEvent} />
                    </div>
                </div></div>
                :
                <div id="homeMainDiv">
                    <div id='homeCardListDiv'>
                        {eventCards}
                    </div>
                    <div className='searchEventDiv'>
                        <p style={{ fontFamily: 'Helvetica', color: 'grey', fontSize: '14px' }}>Join an existing event by pasting its ID below.</p>
                        <div className='searchEventSubDiv'>
                            <input type='text' placeholder='Event ID' onChange={e => setSearchID(e.target.value)} /><input type='button' value='Search' onClick={searchForEvent} />
                        </div>
                    </div>
                </div>

    )

}

export default Home