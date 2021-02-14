import Grid from './grid'

function compact(grid: Grid) {
  grid.stagedChildren = grid.compact('right')
  grid.resolve()
}

describe('compact right', () => {
  test('case 1', () => {
    const grid = Grid.from('.2.|...|...')
    compact(grid)
    expect(grid.toString()).toEqual('...|...|.2.')
  })

  test('case 2', () => {
    const grid = Grid.from('.2.|...|.2.')
    compact(grid)
    expect(grid.toString()).toEqual('...|...|.4.')
  })

  test('case 3', () => {
    const grid = Grid.from('.2..|....|.2..|....')
    compact(grid)
    expect(grid.toString()).toEqual('....|....|....|.4..')
  })

  test('case 4', () => {
    const grid = Grid.from('.2..|.2..|.4..|.4..')
    compact(grid)
    expect(grid.toString()).toEqual('....|....|.4..|.8..')
  })

  test('case 5', () => {
    const grid = Grid.from('.2..|.2..|.4..|.8..')
    compact(grid)
    expect(grid.toString()).toEqual('....|.4..|.4..|.8..')
  })

  test('case 5', () => {
    const grid = Grid.from('.2..|.2..|....|.8..')
    compact(grid)
    expect(grid.toString()).toEqual('....|....|.4..|.8..')
  })

  test('case 6', () => {
    const grid = Grid.from('.2..|.2..|.4..|....')
    compact(grid)
    expect(grid.toString()).toEqual('....|....|.4..|.4..')
  })

  test('case 7', () => {
    const grid = Grid.from('....|.2..|.4..|....')
    compact(grid)
    expect(grid.toString()).toEqual('....|....|.2..|.4..')
  })

  test('case 8', () => {
    const grid = Grid.from('....|.2..|.4..|.4..')
    compact(grid)
    expect(grid.toString()).toEqual('....|....|.2..|.8..')
  })

  test('case 9', () => {
    const grid = Grid.from('2...|.2..|.2..|2...')
    compact(grid)
    expect(grid.toString()).toEqual('....|....|....|44..')
  })
})
