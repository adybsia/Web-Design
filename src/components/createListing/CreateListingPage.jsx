import React from 'react';
import { Switch, Route, Redirect, withRouter } from 'react-router-dom';
import moment from 'moment';

import MainNav from '../MainNav';
import NavCreateListing from './NavCreateListing';
import CreateListingLandingPage from './basics/CreateListingLandingPage';
import CreateListingPlaceType from './basics/CreateListingPlaceType';
import CreateListingAccommodation from './basics/CreateListingAccommodation';
import CreateListingFacilities from './basics/CreateListingFacilities';
import CreateListingSafetyAmenities from './basics/CreateListingSafetyAmenities';
import CreateListingLocation from './basics/CreateListingLocation';
import CreateListingTitle from './placeDescription/CreateListingTitle';
import CreateListingDescription from './placeDescription/CreateListingDescription';
import CreateListingPhotos from './placeDescription/CreateListingPhotos';
import CreateListingHouseRules from './guestSettings/CreateListingHouseRules';
import CreateListingChecking from './guestSettings/CreateListingChecking';
import CreateListingCancellation from './guestSettings/CreateListingCancellation';
import CreateListingPrice from './guestSettings/CreateListingPrice';
import Footer from '../Footer';

import { getCountries, getAmenitiesByCategory, createListing } from '../../requester';

import { Config } from "../../config";
import { NotificationContainer, NotificationManager } from 'react-notifications';
import request from 'superagent';
import update from 'react-addons-update';
const host = Config.getValue("apiHost");
const LOCKCHAIN_UPLOAD_URL = `${host}images/upload`;

class CreateListingPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {

            countries: [],
            categories: [],

            // step 1
            // landing page and place type
            type: '1',
            country: '1',
            propertyType: '1',
            roomType: '',
            dedicatedSpace: '',
            propertySize: '',

            // accommodations
            guestsIncluded: 1,
            bedroomCount: 1,
            bedrooms: [
                this.createBedroom(),
            ],
            bathrooms: 1,

            // facilities
            facilities: new Set(),

            // safety amenities
            smokeDetector: false,
            carbonMonoxideDetector: false,
            firstAidKit: false,
            safetyCard: false,
            fireExtinguisher: false,
            lockOnBedroomDoor: false,

            // location
            billingCountry: '1',
            streetAddress: '',
            city: '',
            apartment: '',
            zipCode: '',

            // step 2
            // title
            name: '',
            description: '',
            neighborhood: '',

            // photos
            uploadedFiles: [],
            uploadedFilesUrls: [],
            uploadedFilesThumbUrls: [],

            // step 3
            // house rules
            suitableForChildren: 'false',
            suitableForInfants: 'false',
            suitableForPets: 'false',
            smokingAllowed: 'false',
            eventsAllowed: 'false',
            otherRuleText: '',
            otherHouseRules: new Set(),

            // checkin
            checkinFrom: '1:00 AM',
            checkinTo: '1:00 AM',
            checkoutFrom: '1:00 AM',
            checkoutTo: '1:00 AM',

            // price
            defaultDailyPrice: '0',
            currency: '2', // USD
        };

        this.onChange = this.onChange.bind(this);
        this.toggleCheckbox = this.toggleCheckbox.bind(this);
        this.updateCounter = this.updateCounter.bind(this);
        this.updateBedrooms = this.updateBedrooms.bind(this);
        this.updateBedCount = this.updateBedCount.bind(this);
        this.toggleFacility = this.toggleFacility.bind(this);
        this.addHouseRule = this.addHouseRule.bind(this);
        this.removeHouseRule = this.removeHouseRule.bind(this);
        this.createListing = this.createListing.bind(this);
        this.resetCity = this.resetCity.bind(this);
        this.onImageDrop = this.onImageDrop.bind(this);
        this.handleImageUpload = this.handleImageUpload.bind(this);
        this.removePhoto = this.removePhoto.bind(this);
    }

    componentDidMount() {
        getCountries().then(data => {
            this.setState({ countries: data.content });
        });

        getAmenitiesByCategory().then(data => {
            this.setState({ categories: data.content });
        });
    };

    onChange(event) {
        this.setState({
            [event.target.name]: event.target.value,
        });
    }

    toggleCheckbox(event) {
        this.setState({
            [event.target.name]: event.target.checked
        });
    }

    updateCounter(event) {
        const name = event.target.name;
        let value = Number(event.target.value);
        if (value < 1) { value = 1; }
        this.setState({ [name]: value });
    }

    updateBedrooms(event) {
        let bedroomCount = this.state.bedroomCount;
        let value = Number(event.target.value);
        if (value < 0) { value = 0; }
        if (value > 9) { value = 9; }
        let newBedrooms = JSON.parse(JSON.stringify(this.state.bedrooms));

        if (value > bedroomCount) {
            for (let i = bedroomCount; i < value; i++) {
                newBedrooms.push(this.createBedroom());
            }
        } else {
            newBedrooms = newBedrooms.slice(0, value);
        }

        this.setState({
            bedroomCount: value,
            bedrooms: newBedrooms,
        });
    }

    updateBedCount(bedroom, e) {
        const bedrooms = JSON.parse(JSON.stringify(this.state.bedrooms));
        const name = e.target.name;
        let value = Number(e.target.value);
        if (value < 0) { value = 0; }
        if (value > 9) { value = 9; }
        bedrooms[bedroom][name] = value;
        this.setState({
            bedrooms: bedrooms,
        })
    }

    toggleFacility(item) {
        let fac = this.state.facilities;
        if (fac.has(item)) {
            fac.delete(item);
        } else {
            fac.add(item);
        }

        this.setState({
            facilities: fac,
        })
    }

    addHouseRule() {
        const rules = this.state.otherHouseRules;
        const value = this.state.otherRuleText;
        if (value && value.length > 0) {
            rules.add(value);
            this.setState({
                otherHouseRules: rules,
                otherRuleText: '',
            })
        }
    }

    removeHouseRule(value) {
        const rules = this.state.otherHouseRules;
        rules.delete(value);
        this.setState({
            otherHouseRules: rules,
        })
    }

    createBedroom() {
        return {
            singleBedCount: 0,
            doubleBedCount: 0,
            kingBedCount: 0,
        };
    }

    resetCity() {
        this.setState({ city: '' });
    }

    getPhotos() {
        let photos = [];
        for (let i = 0; i < this.state.uploadedFilesUrls.length; i++) {
            let photo = {
                sortOrder: i,
                original: this.state.uploadedFilesUrls[i],
                thumbnail: this.state.uploadedFilesThumbUrls[i]
            };

            photos.push(photo);
        }

        return photos;
    }

    createListing() {
        let listing = {
            listingType: this.state.type,
            type: this.state.propertyType,
            country: this.state.country,
            details: [
                {
                    value: this.state.roomType,
                    datail: { name: "roomType" }
                },
                {
                    value: this.state.propertySize,
                    detail: { name: "size" }
                },
                {
                    value: this.state.bedroomCount,
                    detail: { name: "bedroomsCount" }
                },
                {
                    value: this.state.bathrooms,
                    detail: { name: "bathrooms" }
                },
                {
                    value: this.state.apartment,
                    detail: { name: "apartment" }
                }
                ,
                {
                    value: this.state.zipCode,
                    detail: { name: "zipCode" }
                },
                {
                    value: this.state.suitableForChildren,
                    detail: { name: "suitableForChildren" }
                },
                {
                    value: this.state.suitableForInfants,
                    detail: { name: "suitableForInfants" }
                },
                {
                    value: this.state.suitableForPets,
                    detail: { name: "suitableForPets" }
                },
                {
                    value: this.state.smokingAllowed,
                    detail: { name: "smokingAllowed" }
                },
                {
                    value: this.state.eventsAllowed,
                    detail: { name: "eventsAllowed" }
                },
                {
                    value: this.state.dedicatedSpace,
                    detail: { name: "dedicatedSpace" }
                },
                {
                    value: this.state.billingCountry,
                    detail: { name: "billingCountry"}
                }
            ],
            description: {
                street: this.state.streetAddress,
                summary: this.state.description,
                interaction: this.state.neighborhood
            },
            guestsIncluded: this.state.guestsIncluded,
            rooms: this.state.bedrooms,
            amenities: this.state.facilities,
            address: this.state.streetAddress,
            city: this.state.city,
            apartment: this.state.apartment,
            zipCode: this.state.zipCode,
            name: this.state.name,
            pictures: this.getPhotos(),
            otherHouseRules: Array.from(this.state.otherHouseRules).join("\r\n"),
            checkinStart: moment(this.state.checkinFrom, "h:mm A").format("YYYY-MM-DDTHH:mm:ss.SSS"),
            checkinEnd: moment(this.state.checkinTo, "h:mm A").format("YYYY-MM-DDTHH:mm:ss.SSS"),
            checkoutStart: moment(this.state.checkoutTo, "h:mm A").format("YYYY-MM-DDTHH:mm:ss.SSS"),
            checkoutEnd: moment(this.state.checkoutTo, "h:mm A").format("YYYY-MM-DDTHH:mm:ss.SSS"),
            defaultDailyPrice: this.state.defaultDailyPrice,
            currency: this.state.currency,
        }

        createListing(listing).then((res) => {
            if(res.status === 200 || res.status === 202) {
                NotificationManager.success('Successfully updated your profile', 'Update user profile');
            }
            else {
                NotificationManager.error('Error!', 'Update user profile')
            }
        });
    }


    onImageDrop(files) {
        this.handleImageUpload(files)

        this.setState({
            uploadedFiles: files
        });
    }

    handleImageUpload(files) {
        files.forEach((file) => {
            let upload = request.post(LOCKCHAIN_UPLOAD_URL)
                .field('image', file);


            upload.end((err, response) => {
                if (err) {
                    console.error(err);
                }
                if (response.body.secure_url !== '') {
                    this.setState(previousState => ({
                        uploadedFilesUrls: [...previousState.uploadedFilesUrls, response.body.original],
                        uploadedFilesThumbUrls: [...previousState.uploadedFilesThumbUrls, response.body.thumbnail]
                    }));
                }
            });
        });
    }

    removePhoto(e) {
        e.preventDefault();

        let imageUrl = e.target.nextSibling;

        if (imageUrl.src !== null) {
            let indexOfImage = this.state.uploadedFilesUrls.indexOf(imageUrl.getAttribute('src'));

            this.setState({
                uploadedFilesUrls: update(this.state.uploadedFilesUrls, { $splice: [[indexOfImage, 1]] }),
                uploadedFilesThumbUrls: update(this.state.uploadedFilesThumbUrls, { $splice: [[indexOfImage, 1]] })
            });
        }
    }

    render() {
        return (
            <div>
                <nav id="main-nav" className="navbar">
                    <MainNav />
                </nav>

                {this.props.location.pathname !== "/listings/create" && this.props.location.pathname !== "/listings/create/landing" &&
                    <NavCreateListing />
                }

                <div className="container">
                    <div className="row">
                        <Switch>
                            <Redirect exact path="/listings/create/" to="/listings/create/landing" />

                            <Route exact path="/listings/create/landing" render={() =>
                                <CreateListingLandingPage
                                    values={this.state}
                                    onChange={this.onChange} />}
                            />

                            <Route exact path="/listings/create/placetype" render={() =>
                                <CreateListingPlaceType
                                    values={this.state}
                                    toggleCheckbox={this.toggleCheckbox}
                                    onChange={this.onChange} />}
                            />

                            <Route exact path="/listings/create/accommodation" render={() =>
                                <CreateListingAccommodation
                                    values={this.state}
                                    updateCounter={this.updateCounter}
                                    updateBedrooms={this.updateBedrooms}
                                    updateBedCount={this.updateBedCount}
                                />} />

                            <Route exact path="/listings/create/facilities" render={() =>
                                <CreateListingFacilities
                                    values={this.state}
                                    toggle={this.toggleFacility} />} />

                            <Route exact path="/listings/create/safetyamenities" render={() =>
                                <CreateListingSafetyAmenities
                                    values={this.state}
                                    toggle={this.toggleFacility} />} />

                            <Route exact path="/listings/create/location" render={() =>
                                <CreateListingLocation
                                    values={this.state}
                                    updateDropdown={this.onChange}
                                    updateTextbox={this.onChange}
                                    resetCity={this.resetCity} />} />

                            <Route exact path="/listings/create/title" render={() =>
                                <CreateListingTitle
                                    values={this.state}
                                    updateTextbox={this.onChange} />} />

                            <Route exact path="/listings/create/description" render={() =>
                                <CreateListingDescription
                                    values={this.state}
                                    updateTextarea={this.onChange} />} />

                            <Route exact path="/listings/create/photos" render={() =>
                                <CreateListingPhotos
                                    values={this.state}
                                    onImageDrop={this.onImageDrop}
                                    removePhoto={this.removePhoto}
                                />} />

                            <Route exact path="/listings/create/houserules" render={() =>
                                <CreateListingHouseRules
                                    values={this.state}
                                    onChange={this.onChange}
                                    addRule={this.addHouseRule}
                                    removeRule={this.removeHouseRule} />} />

                            <Route exact path="/listings/create/checking" render={() =>
                                <CreateListingChecking
                                    values={this.state}
                                    updateDropdown={this.onChange} />} />

                            <Route exact path="/listings/create/cancellation" render={() =>
                                <CreateListingCancellation />} />

                            <Route exact path="/listings/create/price" render={() =>
                                <CreateListingPrice
                                    values={this.state}
                                    updateNumber={this.onChange}
                                    updateDropdown={this.onChange}
                                    createListing={this.createListing} />} />
                        </Switch>
                    </div>
                </div>
                <NotificationContainer />
                <Footer />
            </div>
        );
    }
}

export default withRouter(CreateListingPage);