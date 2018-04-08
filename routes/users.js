"use strict";

const express = require('express');
const router = express.Router();
const api_key = 'key-f7f6501d5e7940f941c0ac33d20e40a7';
const domain = 'sandboxc840785fd6244d16981cb9f613d95dca.mailgun.org';
const mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });

module.exports = (knex) => {


// function checkEmails (allEmails){
// let emailsToSend = allEmails.join(',')

// }

function sendEmail(subject ,useremail, friendsEmail, voteLink) {

  var data = {
      from: `Chill Poll <${useremail}>`,
      to: `${friendsEmail}`,
      subject: `${subject}`,
      text: `You just got asked about ${subject} for this friday! <hr> Vote NOW! just click on the link bellow:
      ${voteLink} `
    };
    mailgun.messages().send(data, function (error, body) {
      if (error) {
        console.log(error)
      }
      console.log(data);
    });
}

  function getPolls(id) {
    return knex
      .select('options.*', 'polls.name as pollname', 'polls.email as email')
      .from('options')
      .join('polls', 'polls.id', '=', 'options.poll_id')
      .then(function (options) {
        const polls = [];
        for (let i = 0; i < options.length; i++) {
          const existingPoll = polls.find(function (poll) { return poll.poll_id === options[i].poll_id });
          if (!existingPoll) {
            // insert new poll
            let poll = {
              poll_id: options[i].poll_id,
              pollname: options[i].pollname,
              email: options[i].email,
              options: [
                { optionid: options[i].id, rank: options[i].rank, name: options[i].name }
              ]
            };
            polls.push(poll);
          } else {
            // add option to existing poll
            let option = {
              optionid: options[i].id, rank: options[i].rank, name: options[i].name
            }
            existingPoll.options.push(option);
          }
        }
        return polls;
      });
  }

  function savePolls(data) {
    return knex('polls')
      .insert({
        name: data.name,
        email: data.email,
        created_at: new Date().toISOString()
      })
  }

  function saveOptions(id, arr) {
    return new Promise(function (resolve, reject) {
      if (!arr || !id) {
        console.log(err.message);
        return reject(err);
      }
      else {
        var quereey = arr.map((option) => {
          console.log(option);
          return knex('options')
            .insert({ poll_id: id, name: option, rank: 0 })
        })
        console.log('querey', quereey);
        Promise.all(quereey).then(data => {
          console.log("all");
          return resolve();
        })
          .catch(err => {
            console.log(err.message)
          })
      }
    });
  }

  function deletePolls(id) {
    return knex
      .select()
      .from('polls')
      .where('id', "=", id)
      .delete()
  }

  function deleteOptions(id) {
    return knex
      .select()
      .from('options')
      .where('poll_id', "=", id)
      .delete()
  }
  //working
  function findAndDelete(id, email) {
    return new Promise(function (resolve, reject) {
      knex
      .select('email')
      .from('polls')
      .where('id',"=",id)
      .then(function (result) {
        let promises = [];
        if (result[0].email === email) {
          promises.push(deletePolls(id));
          promises.push(deleteOptions(id));
        } else {
          console.log('Permission denied. Only creator has the permission to delete this poll. ')
        }
        Promise.all(promises)
        .then(function () {
          console.log('okkkkkk');
          return resolve();
        })
        .catch(function (err) {
          console.log(err.message);
          return reject(err);
        })
      })
      .catch(function (err) {
      })
    })
  }

function findAndUpdateOptions(pollid, data) {
   return new Promise(function (resolve, reject) {
     knex
       .select()
       .from('options')
       .where('poll_id', pollid)
       .then(function (results) {
         // console.log('resultsssss', results);
         let promises = [];
         for (let i = 0; i < data.length; i++) {
          console.log("I" ,i, "=====> ","DATA[i]: " ,data[i]);
           for (let j = 0; j < results.length; j++) {

            console.log("J", j, "=====> ","RESULTS[j]: ",results[j]);
             if (Number(data[i].optionid) == Number(results[j].id)) {
                 console.log("WHERES THE OPTIONS ====> ", option )
                 console.log("option.id", results[i].id)
                 console.log(`data[${i}].optionid`, data[i].optionid)
               promises.push(knex('options')
                 .where('id', results[j].id)
                 .update({
                   name: data[i].optionname
                 })
                 );
              }
           console.log("im inside the ELSE statement");
           promises.push(knex('options')
             .insert({ poll_id: pollid, name: data[i].optionname }))
           }
         }
         Promise.all(promises).then(function (results) {

           return resolve(results);
         }).catch(function (err) {
           return reject(err);
         })
       })
       .catch(function (err) {
         return reject(err);
       });
   });
 }


  // function findAndUpdateOptions(pollid, data) {
  //   console.log("pollid", pollid);
  //   console.log("data", data);
  //   return new Promise(function (resolve, reject) {
  //     knex
  //       .select()
  //       .from('options')
  //       .where('poll_id', pollid)
  //       .then(function (result) {
  //         console.log("result", result);
  //         let promises = [];
  //         result.forEach(function (option) {
  //           if (option.id === data.optionid) {
  //             promises.push(knex('options')
  //               .where('id', data.option.id)
  //               .update({
  //                 name: data.name
  //               }));
  //           } else {
  //             promises.push(knex('options')
  //               .insert({ poll_id: pollid, name: data.name }))
  //           }
  //           Promise.all(promises).then(function (results) {
  //             return resolve(results);
  //           }).catch(function (err) {
  //             return reject(err);
  //           })
  //         })
  //       })
  //       .catch(function (err) {
  //         return reject(err);
  //       });
  //   })
  // }

  function rankUp(votes) {
    return new Promise(function (resolve, regject) {
      console.log("before", votes);
      if (!votes) {
        return reject(err);
      }
      else {
        var queries = Object.keys(votes).map(function (itemId) {
          return knex('options')
            .where('id', "=", itemId)
            .increment('rank', Number(votes[itemId]))
        })
        Promise.all(queries).then(data => {
          return resolve();
        })
          .catch(err => {
            console.log(err.message)
          })
      }
    })
  }
  //works
  router.get("/all", (req, res) => {
    getPolls(req.params.id)
      .then((results) => {
        res.json(results);
      })
      .catch(function (err) {
        res.send(err);
      });
  });

  //works
  router.get("/votes/:id", (req, res) => {
    knex
      .select('polls.name as pollsname', 'polls.id as pollid', 'options.name as optionsname', 'options.id as optionid')
      .from("polls")
      .rightOuterJoin('options', 'polls.id', '=', 'options.poll_id')
      .where('polls.id', req.params.id)
      .then((results) => {
        console.log(results);
        let templateVars = { results: results };
        res.render("votes", templateVars);
      });
  });
  //works
  router.post("/votes/:id", (req, res) => {
    rankUp(req.body)
      .then(function (result) {
        console.log("resutl", result);
        res.redirect(`/api/polls/result/${req.params.id}`);
      })
      .catch(function (err) {
        console.log(err.message)
        res.status(400).send(err);
      })

  })
  //works
  router.get('/result/:id', (req, res) => {
    getPolls(req.params.id)
      .then(function (output) {
        res.send(output);
      })
      .catch(function (err) {
        res.status(400).send(err);
      })
  })
  //works
  router.post('/new', (req, res) => {

    let useremail = req.body.email
      let linkVo = req.body.link

    sendEmail(req.body.name ,useremail, req.body.friendsEmail, linkVo);
    
    let options = req.body;
    let optionArray = options.options;
    savePolls(options)
      .returning('id')
      .then(function (id) {
        let pollID = id;
        saveOptions(id[0], optionArray)
          //.returning('*')
          .then(function () {
            res.send(pollID);
          })
      })
      .catch(function (err) {
        console.log(err)
        res.status(400).send(err);
      })
  })

  router.delete('/delete/:id', (req, res) => {
    findAndDelete(req.params.id, req.body.email)
      .then(function () {
        res.redirect("/");
      })
      .catch(function (err) {
        res.status(400).send(err);
      })
  })
  //works
  router.get('/edit/:id', (req, res) => {
    getPolls(req.params.id)
      .then(function (result) {
        res.render('edit'); // Rendering the edit page
      })
      .catch(function (err) {
        res.status(400).send(err);
      })
  })

  router.put('/edit/:id', (req, res) => {
    let data = req.body;
    console.log("data", req.body);
    knex('polls')
      .where('id', req.params.id)
      .update({
        name: req.body.title,
        email: req.body.email
      })
      .then(function () {
        findAndUpdateOptions(req.params.id, req.body.options)
          .then(function (results) {
            res.send(results);
          })
          .catch(function (err) {
            res.status(400).send(err);
          })
      })
      .catch(function (err) {
        res.status(400).send(err);
      })
  })

  router.get("/results/:id", (req, res) => {
    res.render("results")
  })

  return router;
};


