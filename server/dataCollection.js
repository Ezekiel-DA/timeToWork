(function () {
  'use strict'

  var moment = require('moment')
  var request = require('request-promise')
  var process = require('process')

    // Google Distance Matrix API setup
  var places
  try {
    places = JSON.parse(process.env['TTW_PLACES_JSON_STRING'])
    if (!places) {
      throw new Error('Places environment variable parsed as JSON but resulted in an empty object.')
    }
  } catch (err) {
    console.log('Failed to get home/work place settings. Did you remember to set TTW_PLACES_JSON_STRING to {"home": "<address>", "work": "<address">} ?')
    throw err
  }

  let apiKey = process.env['TTW_GOOGLE_DISTANCE_MATRIX_API_KEY']
  if (!apiKey) {
    throw new Error('Missing API key for Google Distance Matrix API. Did you remember to set TTW_GOOGLE_DISTANCE_MATRIX_API_KEY ?')
  }

  let baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json'
  let options = 'departure_time=now&mode=driving&alternatives=true&units=metric&traffic_model=best_guess'
  let urlToWork = `${baseUrl}?origins=${places.home}&destinations=${places.work}&key=${apiKey}&${options}`
  let urlFromWork = `${baseUrl}?origins=${places.work}&destinations=${places.home}&key=${apiKey}&${options}`

    // query Google Distance Matrix API
  function queryTravelTime () {
    return Promise.all([request(urlToWork, { json: true }), request(urlFromWork, { json: true })])
            .then(resArray => {
              let [toWork, fromWork] = resArray.map(res => res.rows[0].elements[0].duration_in_traffic.value)
              return { toWork, fromWork }
            })
  }

    // query Google Distance Matrix API and store the results in MongoDB
  function getTravelTimeAndStoreInDB (collection) {
    queryTravelTime().then(timeInfo => {
      let now = moment()
      let data = {}
      data[`values.${now.hours()}.${now.minutes()}`] = timeInfo

      collection.updateOne(
                { daystamp: now.startOf('day').toDate() },
                { $set: data },
                { upsert: true }
            )
    })
  }

    // returns the delay in milliseconds to wait before the next API call, depending on the current
    // time and various rules designed to avoid logging data at uninteresting times and going over our API quota
  function nextAPICallDelay (fromTime) {
    var h = fromTime.hour()
    if ((h >= 6 && h < 10) || (h >= 15 && h < 19)) { // rush hour; log more often
      return 1000 * 60 * 2
    }
    return 1000 * 60 * 10
  }

    // is it ok to skip data collection entirely ? (weekends, nights)
  function canSkipDataCollection (fromTime) {
    if (fromTime.isoWeekday() === 6 || fromTime.isoWeekday() === 7) { // week end : skip
      return true
    }
    if (fromTime.hour() >= 20 || fromTime.hour() < 6) { // night
      return true
    }
    return false
  }

  exports.start = function (collection) {
    setTimeout(function callAPIAndReschedule () {
      if (!canSkipDataCollection(moment())) {
        getTravelTimeAndStoreInDB(collection)
      }
      setTimeout(callAPIAndReschedule, nextAPICallDelay(moment()))
    }, nextAPICallDelay(moment()))
  }
})()
