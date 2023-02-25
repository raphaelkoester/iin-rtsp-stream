{print} = require 'util'
{spawn} = require 'child_process'

build = (watch) ->
  options = ['-c', '-o', 'lib', 'src']
  if watch is true
    options.unshift '-w'
  coffee = spawn 'coffee', options
  coffee.stdout.on 'data', (data) ->
    print data.toString()
  coffee.stderr.on 'data', (data) ->
    console.log data.toString().trim()
  coffee.on 'exit', (code) ->
    if code is not 0
      console.error 'coffee process exited with code', code
      coffee = spawn 'coffee', options
  # coffee.on 'exit', (code) ->
  #   callback?() if code is 0

task 'build', 'Build lib/ from src/', ->
  build false

task 'watch', 'Watch src/ for changes', ->
  build true
