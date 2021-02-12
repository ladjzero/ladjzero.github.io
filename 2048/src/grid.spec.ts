import Grid from './grid'

describe('compact right', () => {
  test('case 1', () => {
    const grid = Grid.from('.2.|...|...')
    grid.compact('right')
    expect(grid.toString()).toEqual('...|...|.2.')
  })

  test('case 2', () => {
    const grid = Grid.from('.2.|...|.2.')
    grid.compact('right')
    expect(grid.toString()).toEqual('...|...|.4.')
  })

  test('case 3', () => {
    const grid = Grid.from('.2..|....|.2..|....')
    grid.compact('right')
    expect(grid.toString()).toEqual('....|....|....|.4..')
  })

  test('case 4', () => {
    const grid = Grid.from('.2..|.2..|.4..|.4..')
    grid.compact('right')
    expect(grid.toString()).toEqual('....|....|.4..|.8..')
  })

  test('case 5', () => {
    const grid = Grid.from('.2..|.2..|.4..|.8..')
    grid.compact('right')
    expect(grid.toString()).toEqual('....|.4..|.4..|.8..')
  })

  test('case 5', () => {
    const grid = Grid.from('.2..|.2..|....|.8..')
    grid.compact('right')
    expect(grid.toString()).toEqual('....|....|.4..|.8..')
  })

  test('case 6', () => {
    const grid = Grid.from('.2..|.2..|.4..|....')
    grid.compact('right')
    expect(grid.toString()).toEqual('....|....|.4..|.4..')
  })

  test('case 7', () => {
    const grid = Grid.from('....|.2..|.4..|....')
    grid.compact('right')
    expect(grid.toString()).toEqual('....|....|.2..|.4..')
  })

  test('case 8', () => {
    const grid = Grid.from('....|.2..|.4..|.4..')
    grid.compact('right')
    expect(grid.toString()).toEqual('....|....|.2..|.8..')
  })
})
