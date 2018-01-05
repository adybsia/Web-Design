import React from 'react';
import { Link } from 'react-router-dom';

import ProfileHeader from '../ProfileHeader';
import MyTripsTable from './MyTripsTable';
import Pagination from 'rc-pagination';
import Footer from '../../Footer';
import { cancelTrip } from "../../../requester";
import { NotificationManager } from 'react-notifications';

import { getMyTrips } from '../../../requester';

export default class MyTripsPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            trips: [],
            loading: true,
            totalTrips: 0,
            currentPage: 1
        }
    }

    componentDidMount() {
        getMyTrips('?page=0').then((data) => {
            this.setState({ trips: data.content, totalTrips: data.totalElements, loading: false });
        })
    }

    cancelTrip(id, captchaToken) {
        this.setState({ loading: true });
        cancelTrip(id, captchaToken)
            .then(res => { this.componentDidMount(); this._operate(res, id, false) });
    }

    onPageChange = (page) => {
        this.setState({
            currentPage: page,
            loadingListing: true
        })

        getMyTrips(`?page=${page - 1}`).then(data => {
            this.setState({
                trips: data.content,
                totalTrips: data.totalElements,
                loadingListing: false
            })
        });
    }

    render() {
        const textItemRender = (current, type, element) => {
            if (type === 'prev') {
                return <div className="rc-prev">&lsaquo;</div>;
            }
            if (type === 'next') {
                return <div className="rc-next">&rsaquo;</div>;
            }
            return element;
        };

        if (this.state.loading) {
            return <div className="loader"></div>
        }

        return (
            <div className="my-reservations">
                <ProfileHeader />
                <section id="profile-my-reservations">
                    <div className="container">
                        <h2>Upcoming Trips ({this.state.totalTrips})</h2>
                        <hr />
                        <MyTripsTable
                            onTripCancel={this.cancelTrip.bind(this)}
                            trips={this.state.trips} />

                        <div className="pagination-box">
                            {this.state.totalListings !== 0 && <Pagination itemRender={textItemRender} className="pagination" defaultPageSize={20} showTitle={false} onChange={this.onPageChange} current={this.state.currentPage} total={this.state.totalTrips} />}
                        </div>

                        <div className="my-listings">
                            <Link className="btn btn-primary create-listing" to="#">Print this page</Link>
                        </div>
                    </div>
                </section>
                <Footer />
            </div>
        );
    }

    _operate(res, id, isAccepted) {
        if (res.success) {
            NotificationManager.success(res.message, 'Reservation Operations')

            let newReservations = this.state.trips.map(r => {
                if (r.id === id) {
                    r.accepted = isAccepted;
                }

                return r;
            });

            this.setState({ trips: newReservations });
        } else {
            NotificationManager.error(res.message, 'Reservation Operations')
        }
    }
}