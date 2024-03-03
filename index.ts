interface User {
    name: string;
    age: number;
    roles: userRole[];
    createdAt: Date;
    isDeleated: boolean;
}

enum userRole {
    USER = 'user',
    ADMIN = 'admin'
}

type HTTPRequest = {
    method: HTTPMethod;
    host: string;
    path: string;
    body?: unknown;
    params: object; 
}

enum HTTPMethod {
    POST = 'POST',
   GET = 'GET'
}

enum HTTPStatus {
   OK = 200,
   INTERNAL_SERVER_ERROR = 500
}

type Handlers = {
    next?:  (request: HTTPRequest) => {},
    error?: (error: HTTPStatus) => {},
    complete?: () => void,
}

class Observer {
    handlers: Handlers; 
    isUnsubscribed: boolean;
    _unsubscribe: (observer?: Observer) => void;

  constructor(handlers: Handlers) {
    this.handlers = handlers;
    this.isUnsubscribed = false;
  }

  next(value: HTTPRequest) {
    if (this.handlers.next && !this.isUnsubscribed) {
      this.handlers.next(value);
    }
  }

  error(error: HTTPStatus) {
    if (!this.isUnsubscribed) {
      if (this.handlers.error) {
        this.handlers.error(error);
      }

      this.unsubscribe();
    }
  }

  complete() {
    if (!this.isUnsubscribed) {
      if (this.handlers.complete) {
        this.handlers.complete();
      }

      this.unsubscribe();
    }
  }

  unsubscribe() {
    this.isUnsubscribed = true;

    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}

class Observable {
    _subscribe: (observer: Observer) => () => void;

  constructor(subscribe: (observer: Observer) => () => void) {
    this._subscribe = subscribe;
  }

  static from(values: HTTPRequest[]) {
    return new Observable((observer) => {
      values.forEach((value) => observer.next(value));

      observer.complete();

      return () => {
        console.log('unsubscribed');
      };
    });
  }

  subscribe(obs: Handlers) {
    const observer = new Observer(obs);

    observer._unsubscribe = this._subscribe(observer);

    return ({
      unsubscribe() {
        observer.unsubscribe();
      }
    });
  }
}

const userMock: User = {
  name: 'User Name',
  age: 26,
  roles: [
    userRole.USER,
    userRole.ADMIN
  ],
  createdAt: new Date(),
  isDeleated: false,
};

const requestsMock: HTTPRequest[] = [
  {
    method:  HTTPMethod.POST,
    host: 'service.example',
    path:  'user',
    body: userMock,
    params: {},
  },
  {
    method: HTTPMethod.GET,
    host: 'service.example',
    path:  'user',
    params: {
      id: '3f5h67s4s'
    },
  }
];

const handleRequest = (request: HTTPRequest) => {
  // handling of request
  return {status: HTTPStatus.OK};
};
const handleError = (error: HTTPStatus) => {
  // handling of error
  return {status: HTTPStatus.INTERNAL_SERVER_ERROR};
};

const handleComplete = () => console.log('complete');

const requests$ = Observable.from(requestsMock);

const subscription = requests$.subscribe({
  next: handleRequest,
  error: handleError,
  complete: handleComplete
});

subscription.unsubscribe();
