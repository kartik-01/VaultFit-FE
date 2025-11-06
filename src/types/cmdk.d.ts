declare module 'cmdk' {
  import * as React from 'react';
  
  export const Command: React.ComponentType<any> & {
    Input: React.ComponentType<any>;
    List: React.ComponentType<any>;
    Empty: React.ComponentType<any>;
    Group: React.ComponentType<any>;
    Item: React.ComponentType<any>;
    Separator: React.ComponentType<any>;
  };
}


