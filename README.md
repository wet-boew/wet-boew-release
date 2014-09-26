# Web Experience Toolkit (WET) Release Module

[![Build Status](https://secure.travis-ci.org/wet-boew/wet-boew.svg?branch=master)](http://travis-ci.org/wet-boew/wet-boew-release)
[![dependency Status](https://david-dm.org/wet-boew/wet-boew/status.svg)](https://david-dm.org/wet-boew/wet-boew-release)
[![devDependency Status](https://david-dm.org/wet-boew/wet-boew/dev-status.svg)](https://david-dm.org/wet-boew/wet-boew-release#info=devDependencies)

This module helps automate the release process for the Web Experience Toolkit core and themes.

## Install

```sh
$ npm install -g wet-boew-release
```

wet-boew-release depends on nodejs and git

## Usage

In the your WET core or theme working directory, run the following command

```sh
$ wet-boew-release
```

The module updates the version number, creates the commit and associated tag and then pushes the result upstream
