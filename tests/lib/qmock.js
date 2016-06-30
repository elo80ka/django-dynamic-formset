/*
 *  QMock - an 'expect-run-verify' JavaScript object mocking library
 *  ===========================================================================
 *
 *  Copyright (c) 2007-2010, Andy Beeching <andybeeching at gmail dot com>
 *  Dual licensed under the MIT and GPL Version 3 licenses.
 *  
 *    * Full documentation is available in the /src folder.
 *    * To generate PDoc docs, navigate to root dir in CLI and run: rake doc
 *    * Or follow more detailed instructions in README if any issues.
 *
 *  jslint laxbreak: true, newcap: true
 *
 **/
 
 // TODO: Add noconflict() method

;(function ( container ) {

  // Trap original methods & reduce lookups in a protected context
  var obj            = {}
    , slice          = [].slice
    , toString       = obj.toString
    , hasOwnProperty = obj.hasOwnProperty
    , undefined;

  // DOCS: QMock.create() -> QMock instance
  function createQMock () {

    // Priviledged (so publically exposed) config object
    // DOCS: QMock.config
    var config = {

      // Flag for failslow behaviour
      // DOCS: QMock.config.failslow -> true | Boolean
      failslow: true,

      // Reference to comparison function
      // DOCS: QMock.config.compare -> null | Function
      compare: null,

      // Callback latency option in milliseconds
      // DOCS:QMock.config.delay -> 100 | Number
      delay: 100
    };

    // Robust cross-frame typeof function
    // DOCS: QMock.utils.is( nativeType, obj ) -> Boolean
    function is ( obj, nativeType ) {
      var lookup = toString.call( obj ).toLowerCase();
      return lookup === ("[object " + nativeType + "]").toLowerCase();
    }

    // Helper function for enumerating over an interface
    // Patches issues of native prototype key shadowing in (yes) IE.
    // DOCS: QMock.utils.enumerate( obj, fn[, thisObject][, bool] ) -> Object
    function enumerate ( obj, fn, thisObject, bool ) {
      for ( var key in obj ) {
        if ( ( bool || hasOwnProperty.call( obj, key) )
          || key === "toString"
          || key === "valueOf" ) {
            fn.call( thisObject || obj, obj[ key ], key, obj );
          }
      }
    }

    // Helper function for iterating through a collection
    // DOCS: QMock.utils.iterate( obj, fn[, thisObject] ) -> Array || Collection
    function iterate ( obj, fn, thisObject ) {
      for ( var i = 0, len = obj.length; i < len; i++ ) {
        fn.call( thisObject || obj, obj[ i ], i, obj );
      }
    }

    // Utility method - tests a parameterList (presentation) against 
    // an Expectation. Can also return associated property values if 
    // key is passed.
    // DOCS: QMock.utils.test( mock, presentation[, prop] ) -> Boolean | Object
    function comparePresentation ( mock, presentation, key ) {
      isCompareSet();
      var result  = false
        , mapping = {"returns": "output", "fixture": "stub"}
        , stop    = false;
      // Compare presention vs expectations
      iterate( mock.expectations, function( item ) {
        if ( !stop && config.compare( presentation, item.accepts ) ) {
          result = key ? item[ key ] || mock[ mapping[ key ] ] : true;
          stop = true;
        }
      });
      return result;
    }
    
    // PRIVATE FUNCTIONS
    
    // Normalises length of two arrays (shortest wins)
    // DOCS: trimCollection( a, b ) -> Array
    function trimCollection ( a, b ) {
      return slice.call( a, 0, b.length );
    }

    // Test for comparison method
    // DOCS: isCompareSet() -> Boolean | Error
    function isCompareSet () {
      if ( !config.compare ) {
        throw new Error('Comparison routine must be set on QMock.compare with signature fn( a, b )');
      }
      return true;
    }

    // Ensures input is an array, or wrapped in one.
    // DOCS: toArray( obj ) -> Array
    function toArray ( obj ) {
      return !is( obj, "array" ) ? [ obj ] : obj;
    }

    // Function to merge two objects (interfaces) together, with custom 
    // scoping mechanism
    // DOCS: mixin( target, obj[, re ] ) -> Boolean
    function mixin ( target, obj, re ) {
      enumerate( obj, function( prop, key ) {
        // Handle overriding
        target[ key ] = re && re.test( key ) && (typeof prop == "function")
          ? (function ( zuper, nue ) {
              return function () {
                zuper.apply(this, arguments);
                return nue.apply(this, arguments);
              };
            })( target[ key ], prop ) // mitigate pesky multiples
          : prop;
      });
      return true;
    }

    // Binds a function to a specific execution context
    // DOCS: bind( fn, thisObject ) -> Function
    function bind ( fn, thisObject ) {
      return function () {
        return fn.apply( thisObject, arguments );
      };
    }

    // Uber-version of bind, iterates over a given interface and binds to
    // specified execution context
    // DOCS: bindInterface( obj, receiver, thisObject )
    function bindInterface ( target, obj, thisObject ) {
      enumerate(obj, function( prop, key ) {
        if ( typeof prop == "function" ) {
          target[ key ] = bind( prop, thisObject );
        }
      });
    }

    // Retrieves the statemachine for any given Mock, Spy or Receiver proxy
    // TODO: Works whether 'excised' from statemachine or not.
    // TODO: Write docs (and, er.. implement)
    // DOCS: getState() -> Mock | Receiver | Spy
    function getState ( obj ) {
      if ( obj instanceof Expectation ) { return obj; }
      if ( is( obj, "function") ) {
        if ( obj.__getState ) {
          return obj.__getState();
        }
        // TODO: Add central repository of *all* mocks to search for cached __getState method
      }
      return false;
    }

    // Create a new recorder bound to a specified statemachine
    // DOCS: createRecorder ( mock, bool ) -> Function
    function createRecorder ( mock, fn ) {
      function recorder () {
        var args = slice.call( arguments );
        // Mutate state
        mock.called++;
        mock.received.push( args );
        // exercise
        return fn ? fn.apply( this, args ) : exerciseMock( mock, args );
      };
      if ( fn ) {
        // constructor-safe spying (cheers Ben Cherry)
        recorder.prototype = fn.prototype;
      }
      return recorder;
    }

    // KLASS DEFINITIONS

    // Key superclass (since all Mocks are receivers also), can be functions or
    // objects (literals).
    // DOCS: class Receiver
    function Receiver () {
      if( !(this instanceof Receiver ) ) {
        return new Receiver;
      }
      this.methods    = [];
      this.properties = {};
      this.namespaces = [];
      // Conventionally overridden in factory to reference public proxy obj
      this.self       = this;
    }

    // Shared instance properties & methods
    Receiver.prototype = {

      // Used to support expects() - Receiver instance method till 0.5 tagged
      tmp: {},

      // Creates a new method on receiver
      // DOCS: Receiver#method( prop, min, max ) -> new Mock
      method: function ( prop, min, max ) {
        if ( hasOwnProperty.call( this.self, prop ) ) {
          throw {
            type: "InvalidMethodNameException",
            msg: "Qmock expects a unique identifier for each mocked method"
          };
        }

        // Register public pointer to mocked method instance on receiver object
        this.self[ prop ] = Mock.create(
          new Mock(
            min || this.tmp.min || this.min,
            max || this.tmp.max || this.max,
            this.self
          )
        );

        // Track methods
        this.methods.push( this.self[ prop ] );

        // Wham!
        return this.self[ prop ].id( prop );
      },

      // Creates a new property on ra eceiver (useful for resetting 
      // post-excercise)
      // DOCS: Receiver#property( prop, val ) -> Receiver | Mock
      property: function ( prop, value ) {
        if ( hasOwnProperty.call( this.self, prop ) ) {
          throw {
            type: "InvalidPropertyNameException",
            msg: "Qmock expects a unique key for each stubbed property"
          };
        }

        // New property on receiver + track properties
        this.self[ prop ] = this.properties[ prop ] = value;

        // Bam!
        return this.self;
      },

      // Creates a new namespace on a receiver, essentially a nested Receiver
      // DOCS: Receiver#namespace( id [, desc ] ) -> new Receiver 
      namespace: function ( prop, desc ) {
        if ( hasOwnProperty.call( this.self, prop ) ) {
          throw {
            type: "InvalidNamespaceIdentiferException",
            msg: "Qmock expects a unique key for a namespace identifer"
          };
        }

        // New namespace on receiver ({})
        this.self[ prop ] = Receiver.create( desc, false );

        // Track namespace
        this.namespaces.push( this.self[ prop ] );

        // Return correct receiver context for augmentation. Pow!
        return this.self[ prop ];
      },

      // Deprecated factory method to create new methods
      // DOCS: Mock#expects( [min = null] [, max = null] ) -> Mock
      expects: function ( min, max ) {
        this.tmp.min = min;
        this.tmp.max = max;
        return this.self;
      },

      // Method which verifies all mocked members (aka namespaces & methods) on
      // a receiver. Takes an optional exception handler.
      // DOCS: Receiver#verify( [raise] ) -> Boolean
      verify: function () {
        // Verify 'leaf' member mock objects
        var result  = true
          , tmp     = config.failslow;

        // Suppress errors thrown at higher level
        // Allows all errors to be collated and thrown as a set
        config.failslow = true;

        iterate( this.methods.concat( this.namespaces ), function ( item ) {
          result &= item.verify();
        });

        // Restore failslow setting
        config.failslow = tmp;

        // Live() || Die()
        var exceptions = this.__getExceptions();

        if ( !config.failslow && exceptions.length ) {
          // Pants.
          throw exceptions;
        } else {
        // WIN. \o/
          return (!!result) && (exceptions.length === 0);
        }
      },

      // Resets receiver statemachine to original declared state
      // DOCS: Receiver#reset() -> Boolean
      reset: function () {
        // Reset all child mocks
        iterate( this.methods.concat( this.namespaces ), function ( item ) {
          item.reset();
        });

        // Reset Properties (may have been mutated)
        enumerate(this.properties, function ( prop, key ) {
          this.self[ key ] = prop;
        }, this);
      },

      // Decouples a receiver (or rather the public proxy) from it's own 
      // interface, while persisting custom properties on the same proxy.
      // DOCS: Receiver#excise() -> Boolean | Error
      excise: function () {
        // 'excise' receiver
        enumerate( Receiver.prototype, function ( prop, key ) {
          delete this.self[ key ];
        }, this);

        iterate( this.methods.concat( this.namespaces ), function ( item ) {
          item.excise();
        });
      },

      // Privileged references for debugging

      // Retrieves all exceptions thrown by receiver or mocked members
      // DOCS: Receiver#__getExceptions() -> Array
      __getExceptions: function () {
        var exceptions = this.self.__getState && this.self.__getState().exceptions || [];
        iterate( this.methods, function ( item ) {
          exceptions = exceptions.concat( item.__getExceptions() );
        });
        return exceptions;
      },

      // Retrieves the private statemachine for a given public receiver proxy
      // DOCS: Receiver#__getState() -> Object (Mock instance state machine)
      __getState: function () {
        return this;
      }
    };

    // Backward compatibility with QMock API v0.1
    Receiver.prototype.andExpects = Receiver.prototype.expects;

    // Receiver Factory Method
    // Use over new Receiver, sets up all state, proxy, and bindings
    Receiver.create = function ( desc, bool ) {

      // Create mock + recorder if definition supplied else plain old object
      var receiver = new Receiver
        , proxy = receiver.self = bool ? Mock.create() : {};

      // Bind private state to public interface
      // If recorder function then interface already bound
      if ( typeof proxy == "object" ) {
        bindInterface( proxy, Receiver.prototype, receiver );
      }

      // Update default return state on mock Constuctors to themselves
      // This facilitates chained expectation declarations
      if ( bool ) {
        proxy.chain();
      }

      // Auto-magikally create mocked interface from mock descriptor
      return desc ? bootstrap( proxy, desc ) : proxy;
    };

    // Private Expectation Constructor
    // DOCS: new Expectation( options )
    function Expectation ( options ) {
      if ( !(this instanceof Expectation) ) {
        return new Expectation( options );
      }
      // augment base expectations
      mixin( this, options );
    }

    Expectation.prototype = {
      // Default Options
      "accepts"  : null,
      "output"   : undefined,
      "chained"  : false,
      "stub"     : null,
      "async"    : true
    };

    // Core mocked method constructor
    // Exposed as QMock.Mock, can return a Receiver or Mock
    // Takes an optional descriptor map to automate Mock/Receiver setup.
    // DOCS: new Mock( desc [, bool] )
    function Mock ( min, max, receiver ) {
      if ( !(this instanceof Mock) ) {
        return new Mock( min, max, receiver );
      }
      // Mock interface constraints
      this.overloadable = true;
      this.requires     = 0;
      // Default mock state
      this.expectations = [];
      this.name         = "anonymous";
      this.received     = [];
      this.minCalls     = min || null;
      this.maxCalls     = max || null;
      this.called       = 0;
      this.exceptions   = [];
      // Instance references
      this.receiver     = receiver;
      this.self         = this;
      // Implements Receiver
      this.methods      = [];
      this.properties   = {};
      this.namespaces   = [];
    }

    // Mock shared instance methods and properties
    Mock.prototype = {

      // Set an identifier or short description for a Mock.
      // Identifers are used for more meaningful error messages.
      // DOCS: Mock#id( identifier ) -> Mock
      id: function ( description ) {
        this.name = description;
        return this.self;
      },

      // Set a *single* parameter expectation (with meta-data for callbacks)
      // Use receives() for multiple expectations
      // DOCS: Mock#accepts( parameters ) -> Mock
      accepts: function () {
        var args = slice.call( arguments );
        this.expectations.push( new Expectation({
          "accepts"  : args
        }));
        // Update common requires expectation to lowest common denominator
        if( args.length > this.requires ) {
          this.requires = args.length;
        }
        return this.self;
      },

      // Set *multiple* parameter expectation (with meta-data for callbacks)
      // DOCS: Mock#receives( expectations ) -> Mock
      receives: function () {
        // Check for valid input to parameterList
        var args = arguments;
        iterate( args, function ( obj ) {
          if ( !"accepts" in (obj || {}) ) {
            throw {
              type: "MissingAcceptsPropertyException",
              msg: "Qmock requires an 'accepts' property for each interface Expectation"
            };
          }
          // Handle single/multiple expected parameters
          obj.accepts = toArray( obj.accepts );

          // Update common requires expectation
          var len = obj.requires || obj.accepts.length;
          if( len > this.requires ) {
            this.requires = len;
          }
          // Cache Expctation
          this.expectations.push( new Expectation(obj) );
        }, this);
        return this.self;
      },

      // Set a common return value for a Mock (for each presentation). 
      // Can be overriden on a per Expectation basis
      // DOCS: Mock#returns( obj ) -> Mock
      returns: function ( obj ) {
        this.output = obj;
        return this.self;
      },

      // Set the number of required arguments for a Mock
      // Use in conjunction with overloading() to make this 'at least' or 'exactly'
      // DOCS: Mock#required( num ) -> Mock
      required: function ( num ) {
        this.requires = num;
        return this.self;
      },

      // Set whether a Mock allows overloading of parameters
      // Use in conjunction with required() to set strict(ness) of input
      // DOCS: Mock#overload( bool ) -> Mock
      overload: function ( bool ) {
        this.overloadable = !!bool;
        return this.self;
      },

      // Set a common fixture to be passed to any callbacks during exercise
      // DOCS: Mock#fixture() -> Mock
      fixture: function () {
        this.stub = slice.call( arguments );
        return this.self;
      },

      // Set whether callbacks are executed asynchronously or synchronously
      // DOCS: Mock#async( bool ) -> Mock
      async: function ( bool ) {
        this.async = !!bool;
        return this.self;
      },

      // Set whether the Mock should return itself during exercise phase (chain)
      // DOCS: Mock#chain() -> Mock
      chain: function () {
        this.output = this.receiver || this.self;
        return this.self;
      },

      // Verify the actual interaction with a Mock against expectations
      // DOCS: Mock#verify( [raise] ) -> Boolean
      verify: function ( raise ) {
        raise = raise || new ErrorHandler( this.exceptions );
        // 1. Assert common interface expectations
        if ( !verifyInvocations( this, raise ) ) {
          return false;
        }
        // 2. Assert each expectation against presentations to interface
        return verifyInterface( this, raise );
      },

      // Set minimum and maximum number of times a Mock is invoked
      // DOCS: Mock#calls( min [, max = null] ) -> Mock
      calls: function ( min, max ) {
        this.minCalls = min;
        this.maxCalls = (max !== undefined) ? max : this.maxCalls;
        return this.self;
      },

      // Ends a mock declaration by returning the receiver object it's 
      // declared upon
      // DOCS: Mock#end() -> Mock
      end: function () {
        return this.receiver;
      },

      // Reset a mock's statemachine to original declared state
      // DOCS: Mock#reset() -> Mock
      reset: function () {
        this.exceptions = [];
        this.called = 0;
        this.received = [];
        return true;
      },

      // Deprecated method to create a new mock on same receiver
      // See instead method()
      // DOCS: Mock#andExpects( [min][, max] ) -> Mock
      andExpects: function ( min, max ) {
        return this.receiver.expects( min, max );
      },

      // Deprecated method for setting minimum number of calls
      // Deemed superflous syntactic sugar :)
      // DOCS: Mock#atLeast( num ) -> Mock
      atLeast: function ( num ) {
        this.minCalls = num;
        this.maxCalls = Infinity;
        return this.self;
      },

      // Deprecated method for setting minimum number of calls
      // Deemed superflous syntactic sugar :)
      // DOCS: Mock#noMoreThan( num ) -> Mock
      noMoreThan: function ( num ) {
        this.maxCalls = num;
        return this.self;
      },

      // Decouples a Mock public proxy object from own interface
      // Persists user-defined properties, methods and namespaces
      // DOCS: Mock#excise() -> Object
      excise: function () {
        enumerate( Mock.prototype, function ( prop, key ) {
          delete this.self[ key ];
        }, this);
      }

    }; // end Mock.prototype declaration

    // Mixin Receiver and Mock klasses
    mixin( Mock.prototype, Receiver.prototype, /verify|reset/ );

    // Backward compatibility for QMock v0.1/0.2 API
    Mock.prototype[ "interface" ]   = Mock.prototype.receives;
    Mock.prototype.withArguments    = Mock.prototype.accepts;
    Mock.prototype.andReturns       = Mock.prototype.returns;
    Mock.prototype.andChain         = Mock.prototype.chain;
    Mock.prototype.callFunctionWith = Mock.prototype.fixture;
    Mock.prototype.expectsArguments = Mock.prototype.accepts;
    Mock.prototype.expects          = Mock.prototype.andExpects;
    
    // PRIVATE METHODS FOR EACH TEST PHASE

    // SETUP PHASE Functions

    // Factory method to instantiate, couple and bind a mock to a recorder
    // DOCS: Mock.create( mock, fn ) -> Function
    Mock.create = function ( mock, fn ) {
      // instantiate statemachine if not passed
      if ( !mock || !mock instanceof Mock ) { mock = new Mock; }

      // Set common interface expectations
      mixin( mock, Expectation.prototype );

      // Mutator for mock instance statemachine
      // Exercises callbacks for async transactions
      // Returns itself, explicit value, or undefined
      var recorder = createRecorder( mock, fn );

      // Public API - Bind inherited methods to private statemachine
      bindInterface( recorder, Mock.prototype, mock );

      // Reference to bound mutator on instance itself (in case of detachment)
      return mock.self = recorder;
    };

    // Constructor for SPY objects, essentially Mocks without the exercise phase
    // Exposed as QMock.Spy
    // DOCS: QMock.Spy() -> Spy
    function Spy ( fn ) {
      return Mock.create( new Mock, fn );
    }

    // Bootstrapper for auto-magically setting up Mocks with a descriptor
    // A little bit meta-crazy...
    // DOCS: bootstrap( mock, desc ) -> Boolean
    var bootstrap = (function () {

      // Test object descriptor against defined interface
      function getDescriptorType ( map ) {
        // Property
        if ( !is( map, "object") ) {
          return "property";
        }
        // Method
        for ( var key in map ) {
          if ( key in Mock.prototype ) {
            return "method";
          }
        }
        // Namespace
        return "namespace";
      }

      // Invokes methods on an interface based on an object descriptor
      function invoker ( obj, map ) {
        enumerate( map, function ( prop, key ) {
          if( is( obj[ key ], "function" ) ) {
            // Use apply in conjunction to toArray in case of
            // multiple values per expectation (e.g. mock.receives)
            // Support for [] grouping notation
            obj[ key ].apply( obj, toArray( prop ) );
          } else {
            // Set namespace or property on mock object
            obj[ getDescriptorType( prop ) ]( key, prop );
          }
        });
      }

      return function ( mock, desc ) {
        // pseudo-break;
        var stop = false;

        // Duck typed mock check since interface proxied (no instanceof)
        if ( !mock.property && !mock.method && !mock.namespace ) {
          // If not valid then create a new MockReceiver instance to augment
          mock = Mock.create();
        }

        // iterate through mock expectations and setup config for each
        enumerate( desc, function ( prop, key, obj ) {
          if ( stop ) { return; }
          // constructor or member?
          var bool  = typeof mock[ key ] == "undefined",
              entry = bool ? prop : obj || {},
              // method || namespace || property
              type  = getDescriptorType( entry ),
              member;

          // if member augment receiver object with new mocked member
          if ( bool ) {
            member = mock[ type ]( key, entry );
          }
          // Auto-setup methods
          if( type === "method" ) {
            invoker( member || mock, entry );
          }
          // If standalone fn then stop (constructor or method)
          if ( !bool ) {
            stop = true;
          }
        });
        // Sweet.
        return mock;
      };
    })();

    // Constructor for new ErrorHandlers
    // DOCS: new ErrorHandler( mock ) -> Function
    function ErrorHandler ( exceptions ) {
      return function () {
        exceptions.push( createException.apply( null, arguments ) );
      };
    }

    // EXERCISE PHASE functions

    // Records all interaction with a Mock, and exercises declared mocked 
    // behaviour (aka callbacks and return values)
    // DOCS: exerciseMock( mock ) -> Function
    function exerciseMock ( mock, presentation ) {
      // Stub responses
      exerciseCallbacks( mock, presentation );
      return exerciseReturn( mock, presentation );
    }

    // Exercises all matching declared callbacks (async or sync)
    // Passes in associated fixture if retrieved.
    // DOCS: exerciseCallbacks(mock, method) -> Boolean
    function exerciseCallbacks ( mock, presentation ) {
      iterate( presentation, function ( item, i, ar ) {
        // Check if potential callback passed
        if ( is( item, "function" ) ) {
          // Use fixture on Expectation, or default to common properties
          var fixture = comparePresentation( mock, ar, "fixture" ) || mock.stub;
          // If response fixture declared, invoke callbacks in a timely manner
          // default is asynchronous / deferred execution
          // else a blocking invocation on same thread
          if ( fixture != null ) {
            if ( mock.async && setTimeout ) {
              // Use a setTimeout to simulate an async transaction
              setTimeout((function ( callback, params ) {
                return function () {
                  callback.apply( null, toArray( params ) );
                }
              })( item, fixture ), config.delay);
            } else {
              item.apply( null, toArray( fixture ) );
            }
          }
          // reset fixture to null for next pass (multiple callbacks)
          fixture = null;
        }
      });
      return true;
    }

    // exercises return value for each interaction with a Mock invocation of)
    // DOCS: exerciseReturn(presentation, method) -> Object | undefined
    function exerciseReturn ( mock, presentation ) {
      return comparePresentation( mock, presentation, "returns" ) || mock.output;
    }

    // TODO: Either abstract this out or simplify
    // Helper method for composing error objects
    // DOCS: createException( actual, expected, exceptionType, identifier ) -> Hash
    function createException ( actual, expected, exceptionType, identifier ) {

      var e = {
          type : exceptionType
        },
        fn = "'" + identifier + "'";

      switch (exceptionType) {
        case "IncorrectNumberOfArgumentsException":
        case "MismatchedNumberOfMembersException":
          e.message = fn + " expected: " + expected
            + " items, actual number was: " + actual;
          break;
        case "IncorrectNumberOfMethodCallsException":
          e.message = fn + " expected: " + expected
            + " method calls, actual number was: " + actual;
          break;
        case "MissingHashKeyException":
          e.message = fn + " expected: " + expected
            + " key/property to exist on 'actual' object, actual was: " + actual;
          break;
        default:
          e.message = fn + " expected: " + expected
            + ", actual was: " + actual;
      }
      return e;
    }

    // VERIFY PHASE functions
    
    // Compares number of times a Mock was invoked against expectations
    // DOCS: QMock.verifyInvocations( mock ) -> Boolean
    function verifyInvocations ( mock, raise ) {
      var result = ( mock.minCalls == null )
        // No invocation expectation so result is true.
        ? true
        // If one expression below true then return
        // else expectations not met, so false
        : (
          // explicit call number defined
          mock.minCalls === mock.called
          // arbitrary range defined
          || ( mock.minCalls <= mock.called )
            && ( mock.maxCalls >= mock.called )
          // at least n calls
          || ( mock.minCalls < mock.called )
            && ( mock.maxCalls === Infinity )
        );
        if ( !result ) {
          raise(
            this.called,
            this.minCalls,
            "IncorrectNumberOfMethodCallsException",
            this.name
          );
        }
        return result;
    }

    // Compares number of parameters passed to Mock against expectations
    // DOCS: QMock.verifyOverloading( mock ) -> Boolean
    function verifyOverloading ( mock, presentation, raise ) {
      var result = ( mock.overloadable )
        // At least n Arg length checking - overloading allowed
        ? ( presentation.length >= mock.requires )
        // Strict Arg length checking - no overload
        : ( presentation.length === mock.requires );
      // Record which presentations fail
      if ( !result ) {
        raise (
          presentation.length,
          mock.requires,
          "IncorrectNumberOfArgumentsException",
          this.name
        );
      }
      return result;
    }

    // Compares a *single* parameter list passed to Mock against expectations
    // DOCS: QMock.verifyPresentation( mock, presentation ) -> Boolean
    function verifyPresentation ( mock, presentation ) {
      isCompareSet();
      var result = false
        , stop   = false;
      // do checks
      iterate( mock.expectations, function ( item ) {
        if ( stop ) { return; }
        // expectation to compare
        var expected = item.accepts;

        // If overloading allowed only want to check parameters passed-in
        // (otherwise will fail). Must also trim off overloaded args as no
        // expectations for them.
        if ( mock.overloadable ) {
          presentation = trimCollection( presentation, expected );
          expected = trimCollection( expected, presentation );
        }

        // Or just pass in expected and actual
        result |= config.compare( presentation, expected );

        // If true, bail.
        if ( !!result ) {
          stop = true;
        }
      });
      return !!result;
    }

    // Compares *multiple* parameter lists passed to Mock against expectations
    // DOCS: QMock.verifyInterface( mock [, raise] ) -> Boolean
    function verifyInterface ( mock, raise ) {
      var result = true;
      // For each presentation to the interface...
      iterate( mock.received, function ( presentation ) {
        // verify overloading where scenario of no expectations
        verifyOverloading( mock, presentation, raise );
        // else check for a matching expectation & behaviour
        if ( mock.expectations.length ) {
          result &= verifyPresentation( mock, presentation );
        }
        // Record which presentations fail
        if ( !result ) {
          raise && raise(
            presentation,
            mock.expectations,
            "IncorrectParameterException",
            mock.name + '()'
          );
        }
      });
      return !!result;
    }

    // PUBLIC API
    return {
      version: "0.4.5",
      config : config,
      create : createQMock,
      // Priviledged references
      Mock: function ( map, bool ) {
        return Receiver.create( map || {}, is( bool, "boolean") ? bool : true );
      },
      Spy: Spy,
      // Utility methods for use on 'excised' mock instances or testing.
      utils: {
        // Verifies any Mock (public proxy) object passed to it, excised or not.
        // DOCS: QMock.utils.verify( receiver [, raise] ) -> Boolean | Exception
        verify: function ( mock ) {
          if ( mock.verify ) {
            return mock.verify();
          }
        },
        reset: function ( mock) {
          if ( mock.reset ) {
            return mock.reset();
          }
        },
        is: is,
        eumerate: enumerate,
        test: function () {
          arguments[0] = getState( arguments[0] );
          return comparePresentation.apply( null, arguments );
        }
      },
      // only exposed for integration tests
      __bootstrap: bootstrap
    };

  }// end init

  // Initialise a QMock instance
  container.QMock = container.QMock || createQMock();

  // Alias QMock.Mock & QMock.Spy for simple use
  container.Mock = container.QMock.Mock;
  container.Spy = container.QMock.Spy;

  // Bish bash bosh.
  return true;

// if exports available assume CommonJS
})( (typeof exports !== "undefined") ? exports : this );