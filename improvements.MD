- Try lodash
  - sum
    - now: `listings.map(l => l.units).reduce((acc, v) => acc + v, 0)`
    - then: `_.sum(listings.map(l => l.units))`
  - count map
    - now: `listings.map(l => l.title).reduce((acc, curr) => {
      return acc[curr] ? ++acc[curr] : acc[curr] = 1, acc
      }, {})`
    - then: `_.countBy(listings.map(l => l.title));`
