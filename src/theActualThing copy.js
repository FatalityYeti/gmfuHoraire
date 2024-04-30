function splitmix32(inputseed) {
  let h1 = 1779033703, h2 = 3144134277,
    h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, k; i < inputseed.length; i++) {
    k = inputseed.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
  let a = h1>>>0
  if (typeof weekKey !== 'undefined') {
    console.log("rand without week")
    if (weekKey == 1) {a = h2>>>0}
    if (weekKey == 2) {a = h3>>>0}
    if (weekKey == 3) {a = h4>>>0}
  }
  return function() {
    a |= 0;
    a = a + 0x9e3779b9 | 0;
    let t = a ^ a >>> 16;
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  }
}
const rand = splitmix32("randomseedtobesetlater")

function periodsOfWeek(weekKey) {return Array(21).fill(0).map((_, index) => index + weekKey * 21)}
function randomiseArray(inputArray) {
  let inputClone = [...inputArray]
  let outputArray = []
  while(inputClone.length > 0) {
    outputArray.push(inputClone.splice(Math.floor(rand() * inputClone.length), 1)[0])
  }
  return outputArray
}


function calcSchedule() {
  console.log("before", data.people)
  // weird fix
  for (let person in data.people) {
    data.people[person].inputs.askedPeriods = data.people[person].inputs.askedPeriods.map(val => parseInt(val + ""))
  }



  data.global.schedule = yetiLib.clone(data.global.inputs)
  data.global.schedule.askedOffices = Array(84).fill(0)

  for (let activityKey in data.activities) {
    const activity = data.activities[activityKey]
    if (activity.schedule == undefined) activity.schedule = {}
    if (activity.supervision) {activity.schedule.availableSupervisors = Array(84).fill([])}
  }

  // copying data
  for (let personKey in data.people) {
    const person = data.people[personKey]
    person.schedule = {...yetiLib.clone(person.inputs), ...yetiLib.clone(person.trackers)}
  }
  // global overwrites to dispo grids
  for (let periodKey in data.global.schedule.ouverture) {
    // putting all available people as not available if its closed (safety measure)
    if (!data.global.schedule.ouverture[periodKey]) {
      data.global.schedule.srv[periodKey] = false;
      data.global.schedule.availableOffices[periodKey] = 0;
      Object.entries(data.people).map(([personKey, person]) => {
        if (person.schedule.dispo[periodKey] == "dispo") {person.schedule.dispo[periodKey] = "indisponible"}
      })
    }
    // overwrites for activities that affect all students
    if (data.global.schedule.dispoR1[periodKey] != "dispo") {
      Object.entries(data.people).map(([personKey, person]) => {
        if (person.role == "res" && person.resYear == 1) {person.inputs.dispo[periodKey] = data.global.schedule.dispoR1[periodKey]}
      })
    }
    if (data.global.schedule.dispoR2[periodKey] != "dispo") {
      Object.entries(data.people).map(([personKey, person]) => {
        if (person.role == "res" && person.resYear == 2) {person.inputs.dispo[periodKey] = data.global.schedule.dispoR2[periodKey]}
      })
    }
    if (data.global.schedule.dispoExt[periodKey] != "dispo") {
      Object.entries(data.people).map(([personKey, person]) => {
        if (person.role == "ext") {person.inputs.dispo[periodKey] = data.global.schedule.dispoExt[periodKey]}
      })
    }
  }

  // schedule one week at a time
  for (let weekKey = 0; weekKey < 4; weekKey++) {
    // 1. counting total asked periods. srv is seperate because we dont include ones that dont do it
    let totalAskedPeriods = 0;
    let totalAskedSrv = 0;
    for (let personKey in data.people) {
      const person = data.people[personKey]
      totalAskedPeriods += data.people[personKey].inputs.askedPeriods[weekKey]
      if (person.competences.SRV != undefined) {totalAskedSrv += data.people[personKey].inputs.askedPeriods[weekKey]}
    }
    // 2. applying all the activities already in the schedule
    for (let personKey in data.people) {
      const person = data.people[personKey]
      for (let periodKey of randomiseArray(periodsOfWeek(weekKey))) {
        assignPeriod(person, periodKey, person.schedule.dispo[periodKey])
      }
    }
    // 3. distributing srvSoir, then Srv
    // 3.1 listing the periods to fill
    let srvSoirToFill = []
    let srvToFill = []
    for (let periodKey of periodsOfWeek(weekKey)) {
      if (data.global.schedule.srv[periodKey]) {
        if (periodKey % 3 == 2) {
          srvSoirToFill.push(periodKey)
        } else {
          srvToFill.push(periodKey)
        }
      }
    }
    // 3.2 compensation numbers
    for (let personKey in data.people) {
      const person = data.people[personKey]
      if (person.competences.SRV != undefined) {
        person.schedule.compSrv += (srvToFill.length + srvSoirToFill.length) / totalAskedSrv * person.inputs.askedPeriods[weekKey]
        person.schedule.compSrvSoir += srvSoirToFill.length / totalAskedSrv * person.inputs.askedPeriods[weekKey]
      }
    }
    // 3.3 attributing to the highest comp numbers
    for (let periodKey of randomiseArray(srvSoirToFill)) {
      let highestCompValue = -Infinity
      let highestCompPerson = undefined
      for (let personKey of randomiseArray(Object.keys(data.people))) {
        const person = data.people[personKey];
        if (person.competences.SRV == undefined) {continue}
        if (person.schedule.askedPeriods == 0) {continue}
        if (person.schedule.dispo[periodKey] != "dispo") {continue}
        if (person.schedule.compSrvSoir > highestCompValue) {highestCompPerson = person; highestCompValue = person.schedule.compSrvSoir}
      }
      if (highestCompPerson == undefined) {console.warn("unable to fill srv spot"); continue}
      assignPeriod(highestCompPerson, periodKey, "SRV")
    }
    for (let periodKey of srvToFill) {
      let highestCompValue = -Infinity
      let highestCompPerson
      for (let personKey of randomiseArray(Object.keys(data.people))) {
        const person = data.people[personKey];
        if (person.competences.SRV == undefined) {continue}
        if (person.schedule.askedPeriods == 0) {continue}
        if (person.schedule.dispo[periodKey] != "dispo") {continue}
        if (person.schedule.compSrv > highestCompValue) {highestCompPerson = person; highestCompValue = person.schedule.compSrv}
      }
      if (highestCompPerson == undefined) {console.warn("unable to fill srv spot"); continue}
      assignPeriod(highestCompPerson, periodKey, "SRV")
    }
    // 4. attributing bureaux
    // 4.1 estimation of how many soirs are required
    let totalSpaces = 0;
    let totalAsked = 0;
    for (let periodKey of periodsOfWeek(weekKey)) {
      let askedInPeriod = 0
      for (let personKey in data.people) {
        const person = data.people[personKey]
        if (person.schedule.dispo[periodKey] == "dispo") {
          askedInPeriod += 1
        }
      }
      totalSpaces += Math.min(data.global.schedule.availableOffices[periodKey], askedInPeriod)
      totalAsked += askedInPeriod
    }
    // 4.2 compensation numbers based on that estimation
    const soirsNeeded = srvSoirToFill.length + totalAsked - totalSpaces
    for (let personKey in data.people) {
      const person = data.people[personKey]
      if (person.compSoir != undefined) {
        person.schedule.compSoir += soirsNeeded / totalAskedPeriods * person.inputs.askedPeriods
      }
    }
    console.log("estimation of soirs needed", soirsNeeded)
    // 4.3 loop until all is attributed
    for (let execLimit = 100; execLimit >= 0; execLimit--) {
      if ((()=>{
        // l.1 find people who ask all the places where they are available and offices are left. attribute them to them
        for (let personKey of randomiseArray(Object.keys(data.people))) {
          const person = data.people[personKey]
          if (person.schedule.askedPeriods[weekKey] <= 0) {continue}
          let openSpots = []
          for (let periodKey of periodsOfWeek(weekKey)) {
            if (data.global.schedule.availableOffices[periodKey] <= 0) {continue}
            if (person.schedule.dispo[periodKey] != "dispo") {continue}
            openSpots.push(periodKey)
          }
          if (openSpots.length > 0 && (openSpots.length <= person.schedule.askedPeriods[weekKey])) {
            for (let periodKey of openSpots) {
              assignPeriod(person, periodKey, "BUR")
            }
            console.log("l.1 assigned all periods asked by", personKey)
            return true
          }
        }
        //l.2



        // l.3 find the period that has the least demand over open spots
        let bestPeriodKey = undefined;
        let bestPeriodOfficesLeft = -Infinity
        for (let periodKey of randomiseArray(periodsOfWeek(weekKey))) {
          if (!data.global.schedule.ouverture[periodKey]) {continue}
          if (data.global.schedule.availableOffices[periodKey] <= 0) {continue}
          if (periodKey % 3 == 2) {continue}
          let askedOffices = 0
          for (let personKey in data.people) {
            const person = data.people[personKey]
            if (person.schedule.dispo[periodKey] == "dispo" && person.schedule.askedPeriods[weekKey] > 0) {askedOffices++}
          }
          if (data.global.schedule.availableOffices[periodKey] - askedOffices > bestPeriodOfficesLeft && askedOffices != 0) {
            bestPeriodOfficesLeft = data.global.schedule.availableOffices[periodKey] - askedOffices;
            bestPeriodKey = periodKey
          }
        }
        // l.4 fill that period
        if (bestPeriodKey != undefined) {
          if (bestPeriodOfficesLeft >= 0) {
            for (let personKey of randomiseArray(Object.keys(data.people))) {
              const person = data.people[personKey];
              if (person.schedule.dispo[bestPeriodKey] == "dispo" && person.schedule.askedPeriods[weekKey] > 0) {
                if (data.global.schedule.availableOffices[bestPeriodKey] > 0) {
                  assignPeriod(person, bestPeriodKey, "BUR")
                }
              }
            }
            console.log("l.4 assigned all people that wanted period", bestPeriodKey)
            return true
          }
        }
        
        // deal with the periods overflowing
        const missingLimit = 1;
        let overflow = {
          periods: [],
          people: []
        }
        let isOverflowing = false
        
        for (let periodKey of periodsOfWeek(weekKey)) {
          if (data.global.schedule.availableOffices[periodKey] <= 0) {continue}
          let period = {
            key: periodKey,
            availableOffices: data.global.schedule.availableOffices[periodKey]
          }
          let overflowAmount = 0 - data.global.schedule.availableOffices[periodKey]
          for (let personKey in data.people) {
            const person = data.people[personKey]
            if (person.schedule.askedPeriods[weekKey] <= 0) continue
            if (person.schedule.dispo[periodKey] != "dispo") continue
            overflowAmount++
          }
          if (overflowAmount > 0) {
            overflow.periods.push(period)
            isOverflowing = true
          } else if (periodKey % 3 == 2) {
            overflow.periods.push(period)
          }
        }
        if (isOverflowing) {
          console.warn("overflow periods found", overflow.periods)
          console.log("adding evenings to overflow for buffer")
        } else {
          console.warn("no overflow")
          return
        }
        for (let personKey in data.people) {
          const person = data.people[personKey]
          if (person.schedule.askedPeriods[weekKey] <= 0) continue
          let personData = {
            key: personKey,
            periods: [],
            askedPeriods: person.schedule.askedPeriods[weekKey],
            playLeft: 0 - person.schedule.askedPeriods[weekKey],
          }
          for (let period of overflow.periods) {
            personData.periods.push({
              available: person.schedule.dispo[period.key] == "dispo",
              given: false,
              key: period.key,
            })
            if (person.schedule.dispo[period.key] == "dispo") {personData.playLeft++}
          }
          overflow.people.push(personData)
        }
        console.warn("overflow ppl found", overflow.people)


        function evalOption(solution) {
          let score = 0;
          for (let person of solution.people) {
            score -= person.askedPeriods
            let comp = person.compSoir
            for (let periods of person.periods) {
              if (periods.key % 3 == 2) {
                score -= Math.min(0.75, 0.25 / Math.max(0.25, person.compSoir, comp + 0.75))
                comp--
              }
            }
          }
          return score
        }
        let limit = 100000
        function compareOptions(inputOptions) {
          let bestOption = [null, -Infinity]
          console.log("compare", inputOptions)
          for (let option of inputOptions) {
            if (option === null) {continue}
            const score = evalOption(option)
            if (score > bestOption[1]) {bestOption = [option, score]}
          }
          return bestOption[0]
        }
        let branchesDone = 0
        function bruteForceTree(currentPersonI, currentPeriodI, inputTree, branch) {
          console.log("branch", branch)
          limit--
          if (limit <= 0) {console.error("limit hit"); return}
          if (currentPeriodI == inputTree.periods.length) {
            console.log("nextperson")
            currentPersonI +=1
            currentPeriodI = 0
          }
          if (currentPersonI == inputTree.people.length) {branchesDone++; console.warn("end of branch", branchesDone); return inputTree}

          const person = inputTree.people[currentPersonI]
          let options = []

          // give them all periods remaining if there is no play left
          console.log("playleft", currentPersonI, person.playLeft)
          if (person.playLeft <= 0 - missingLimit) {
            const newTree = yetiLib.clone(inputTree)
            let periodI = 0;
            for (let period of newTree.people[currentPersonI].periods) {
              if (period.available) {
                period.given = true
                newTree.periods[periodI].availableOffices--
                newTree.people[currentPersonI].totalGiven++
              }
              periodI++
            }
            return bruteForceTree(currentPersonI, periodI, newTree, [...branch, currentPersonI+"-"+(periodI-1)+"t"])
          }
          // option of giving them a period if available and there are offices left
          if (person.askedPeriods > 0 && person.periods[currentPeriodI].available && inputTree.periods[currentPeriodI].availableOffices > 0) {
            const newTree = yetiLib.clone(inputTree)
            newTree.people[currentPersonI].periods[currentPeriodI].given = true
            newTree.periods[currentPeriodI].availableOffices--
            newTree.people[currentPersonI].totalGiven++

            // remove the next evening if its morning
            if (newTree[currentPeriodI] % 3 == 0) {
              const soirKey = newTree[currentPeriodI] + 2
              for (let period of newTree.people[currentPersonI].periods) {
                if (period.key == soirKey) {
                  if (period.available) {
                    period.available = false
                    newTree.people[currentPersonI].playLeft--
                  }
                }
              }
            }
            options.push(bruteForceTree(currentPersonI, currentPeriodI + 1, newTree, [...branch, currentPersonI+"-"+currentPeriodI+"t"]))
          }

          // option of not giving them a period
          const newTree = yetiLib.clone(inputTree)
          newTree.people[currentPersonI].periods[currentPeriodI].given = false
          newTree.people[currentPersonI].playLeft--
          options.push(bruteForceTree(currentPersonI, currentPeriodI + 1, newTree, [...branch, currentPersonI+"-"+currentPeriodI+"f"]))
          
          
          if (options.length == 0) {return null}
          if (options.length == 1) {return options[0]}
          return compareOptions(options)
        }
        if (overflow.periods.length != 0) {
          const bestSolution = bruteForceTree(0, 0, overflow, [])
          for (let personData of bestSolution.people) {
            for (let period of personData.periods) {
              if (period.given) {
                assignPeriod(data.people[personData.key], period.key, "BUR")
              }
            }
          }
          console.warn("overflow code executed")
          return
        }


        // l.5 move people around to free up space
        // find periods with overflow
        /*
        let overflowPeriods = []
        for (let periodKey of randomiseArray(periodsOfWeek(weekKey))) {
          if (data.global.schedule.availableOffices[periodKey] <= 0) {continue}
          let period = {
            key: periodKey,
            peopleKeys: [],
            overflow: 0 - data.global.schedule.availableOffices[periodKey],
            availableOffices: data.global.schedule.availableOffices[periodKey]
          }
          for (let personKey in data.people) {
            const person = data.people[personKey]
            if (person.schedule.askedPeriods[weekKey] <= 0) continue
            if (person.schedule.dispo[periodKey] != "dispo") continue
            period.overflow++
            period.peopleKeys.push(personKey)
          }
          if (period.overflow > 0) {
            overflowPeriods.push(period)
          }
        }
        if (overflowPeriods.length == 0) {
          console.log("no day conflicts left in week", weekKey)
        } else {
          console.warn("conflicts in week", weekKey, ":", overflowPeriods.map(a => a.key))

          // o.1 count total asked periods left
          let peopleLeft = []
          let askedPeriodsLeft = 0
          for (let personKey in data.people) {
            const person = data.people[personKey]
            
            if (person.schedule.askedPeriods[weekKey] > 0) {
              askedPeriodsLeft += person.schedule.askedPeriods[weekKey];
              peopleLeft.push({
                key: personKey,
                compSoir: person.schedule.compSoir,
                askedPeriods: person.schedule.askedPeriods[weekKey],
              })
            }
          }

          let availableSpotsLeft = 0
          for (let period of overflowPeriods) {availableSpotsLeft += period.availableOffices}

          console.log("o.1 asked periods left", askedPeriodsLeft)
          console.log("vailable periods left", availableSpotsLeft)
          console.log("people left", peopleLeft)


          
          // o.2 if there are more spots than asked periods, assign one to the person with the lowest comp number
          if (askedPeriodsLeft <= availableSpotsLeft) {
            let bestPersonComp = Infinity
            let bestPerson
            for (let person of randomiseArray(peopleLeft)) {
              if (person.compSoir < bestPersonComp) {
                bestPerson = person
                bestPersonComp = person.compSoir
              }
            }
            let bestPeriod
            let bestPeriodOverflow = Infinity
            for (let period of overflowPeriods) {
              if (data.people[bestPerson.key].schedule.dispo[period.key] != "dispo") continue
              if (period.overflow < bestPeriodOverflow) {
                bestPeriod = period
                bestPeriodOverflow = period.overflow
              }
            }
            assignPeriod(data.people[bestPerson.key], bestPeriod.key, "BUR")
            console.log("o.2 assigned period", bestPeriod.key, "to", bestPerson.key)
            return true
          } else {
            // o.3 assigning a soir if there are more asked periods than available periods
            let bestPersonComp = -Infinity
            let bestPerson
            let bestPersonPeriodKey
            for (let person of randomiseArray(peopleLeft)) {
              let soirPeriodKey
              for (let periodKey of randomiseArray(periodsOfWeek(weekKey))) {
                if (periodKey % 3 != 2) continue
                if (data.people[person.key].schedule.dispo[periodKey] == "dispo") soirPeriodKey = periodKey
              }
              if (soirPeriodKey == undefined) {continue}
              if (person.compSoir > bestPersonComp) {
                bestPerson = person
                bestPersonComp = person.compSoir
                bestPersonPeriodKey = soirPeriodKey
              }
            }
            if (bestPerson == undefined) {
              console.error("unable to complete schedule of week", weekKey)
              return false
            }
            assignPeriod(data.people[bestPerson.key], bestPersonPeriodKey, "BUR")
            console.log("o.3 assigned soir", bestPersonPeriodKey, "to", bestPerson.key)
            return true
          }
        }
        */
        // il faut bouger des gens aux soirs
        // tout ceux qui ont deja cette periode ne sont peuvent pas se la faire bouger (plus de dispos)
        // on commence par faire le total des persiodes demandees par les personnes pour voir si cela excede le nombre de periodes possibles.

        // on peut trouver quelquun de dispo le soir meme si cest un matin et le bouger
        //
      })()) {
        // loop did something, so continue
      } else {
        // nothing happened meaning its done or faied
        console.warn("finished assign loop of week", weekKey, "in", (100 - execLimit), "tries")
        break
      }
      if (execLimit == 0) {console.error("infinitely looped when attributing bureaux")}
    }
    console.log("looped")
  }

  function updateCounts() {
    
    
    // counting available supervisors at each period (old)
    for (let activityKey in data.activities) {
      const activity = data.activities[activityKey]
      if (!activity.supervision) continue
      activity.schedule.availableSupervisors.splice(weekKey * 21, 21, ...Array(21).fill([]))
      for (let personKey in data.people) {
        const person = data.people[personKey]
        if (person.role == "med" && person.competences[activityKey] == true) {
          for (let periodKey of periodsOfWeek(weekKey)) {
            if (person.inputs.dispo[periodKey] == "dispo") {
              activity.schedule.availableSupervisors[periodKey].push(personKey)
            }
          }
        }
      }
    }
  }

  function assignPeriod(person, periodKey, activityKey) {
    person.schedule.dispo[periodKey] = activityKey
    const weekKey = Math.floor(periodKey / 21)
    const activity = data.activities[activityKey]
    // update counters
    if (["bureau", "srv", "clinique"].includes(activity.type)) {
      data.global.schedule.availableOffices[periodKey]--
      if (!person.inputs.tripleDays[weekKey]) {
        if (periodKey % 3 == 2) {if (person.schedule.dispo[periodKey - 2] == "dispo") {person.schedule.dispo[periodKey - 2] = "locked"}};
        if (periodKey % 3 == 0) {if (person.schedule.dispo[periodKey + 2] == "dispo") {person.schedule.dispo[periodKey + 2] = "locked"}};
      }
      if (!person.inputs.AMafterPM[weekKey]) {
        if (periodKey % 3 == 2 && periodKey != 20) {if (person.schedule.dispo[periodKey + 1] == "dispo") {person.schedule.dispo[periodKey + 1] = "locked"}};
        if (periodKey % 3 == 0 && periodKey != 0) {if (person.schedule.dispo[periodKey - 1] == "dispo") {person.schedule.dispo[periodKey - 1] = "locked"}};
      }
    }
    if (activityKey == "BUR") {
      if (person.schedule.askedPeriods != undefined) person.schedule.askedPeriods[weekKey]--
      if (person.schedule.compSoir != undefined) {
        if (periodKey % 3 == 2) person.schedule.compSoir-- 
      }
    }
    if (activityKey == "SRV") {
      data.global.schedule.srv[periodKey] = false
      if (person.schedule.askedPeriods != undefined) person.schedule.askedPeriods[weekKey]--
      if (person.schedule.compSrv != undefined) {
        person.schedule.compSrv--
        if (periodKey % 3 == 2) {person.schedule.compSrvSoir--; person.schedule.compSoir--}
      }
    }
    /*
    if (person.schedule.askedPeriods[weekKey] <= 0) {
      for (let periodKey of periodsOfWeek(weekKey)) {
        if (person.schedule.dispo[periodKey] == "dispo") {person.schedule.dispo[periodKey] = "indisponible"}
      }
    }*/
  }

  // update residents compensation values
  /*
  Object.entries(data.activities)
  .filter(([_, activity]) => activity.supervision)
  .map(([activityKey, activity]) => {
    Object.entries(data.people).map([personKey, person]) {
      if (person.role == "res" && person.year == 1) {
        person.trackers.
      } else if (person.role == "res" && person.year == 2) {
        Object.entries
        Object.entries(person.trackers).map([personKey, person])
      } else if (person.role == "sips") {

      }
      
    })
  })
    */

  // fixed med activities
}

function genSchedule() {
  if (horaireState != "inputs") return
  calcSchedule()
  horaireState = "outputs"
  renderPage()
}