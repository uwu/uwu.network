---
layout: "^layouts/QuietLayout.astro"
title: The Oxidation Pt. 2 - Bending Rust to my will
description: Rust series post on proc macros
pubDate: "2023-03-03T20:47:00"
tags: ["RUST", "OXIDATION"]
---

<img src="/sink/quiet_oxidation_banner.svg" class="max-w-200" />

# the_oxidation[2]: Bending Rust to my will

So this post isn't actually on Paramin, its based on another Rust project, yallvm.

I was writing an abstract syntax tree (AST), made up of structs and nodes.

So to start with, I got some basics going:

```rs
#[derive(Debug, Clone)]
pub enum Expr {
  StrLit(StrLitExpr)
}

#[derive(Debug, Clone)]
pub struct StrLitExpr {
  pub span: Span,
  pub value: Vec<StrLitPart>,
}

#[derive(Debug, Clone)]
pub enum StrLitPart {
	Str(String),
	Interpolation(Box<Expr>),
}
```

## The functionality we want

Now, wouldn't it be really nice if we could convert the AST nodes into the respective enums?

Well we could use the `From` trait to do this. One already exists for boxing which is helpful:
```rs
let myNode: StrLitExpr = ...;
let boxed: Boxed<StrLitExpr> = myNode.into();
```

But what about converting the `StrLitExpr` into an `Expr`?

Well we can simply implement it:
```rs
impl From<StrLitExpr> for Expr {
  #[inline(always)]
  fn from(item: StrLitExpr) -> Expr {
    Expr::StrLit(item)
  }
}
```

And to make it easy to box at the same time, let's add another:
```rs
impl From<StrLitExpr> for Box<Expr> {
  #[inline(always)]
  fn from(item: StrLitExpr) -> Box<Expr> {
    // this into() references the previously written trait
    Box::new(item.into())
  }
}
```

## Automation & setup

Okay, so first off, we're writing a *derive macro*, which is a kind of proc macro.

Start by creating a lib crate, and adding the `syn` and `quote` packages:
```sh
cargo new --lib yallvm_macros
cd yallvm_macros
cargo add syn
cargo add quote
```

Now, go into `Cargo.toml` and make sure the lib section is just:
```toml
[lib]
proc-macro = true
```

Finally, we can start macroing!

Derive macros are basically just functions that take a stream of tokens for the target,
and return a stream of tokens to be new code:
```rs
extern crate proc_macro;

use proc_macro::{Span, TokenStream};
use quote::quote;
use syn::{parse_macro_input, DeriveInput, Ident};

#[proc_macro_derive(Ast)]
pub fn derive_ast_node(input: TokenStream) -> TokenStream {
  TokenStream::default()
}
```

Now, the two crates we added earlier were `syn` and `quote`.

Syn's job is to parse the tokenstream we are given and to give us back some useful information,
in this case, the name of the target struct/enum.

Quote's job is to let us write Rust code with interpolated in tokens, to let us write new code easily.

Here's a really basic example of using quote:
```rs
let helo = Ident::new("hello_there", ...);
let quoteTokStream = quote! {
  pub fn #helo() -> i32 {
    42069
  }
};
let rustTokStream: TokStream = quoteTokStream.into();
```

Which creates the following code when expanded:
```rs
pub fn hello_there() -> i32 {
  42069
}
```

## Time to write a macro

The first thing to write is a list of enums we care about, which we can do at the top level:
```rs
const ENUMS: &[(&str, &str)] = &[
  // crate::stmts::Stmt
  ("Stmt", "stmts"),
  ("Expr", "exprs"),
  ("Member", "classes"),
  ("CollectionItem", "exprs"),
];
```

And a utility function, just because it'll be useful easier:
```rs
fn remove_last_chars(amt: usize, s: &String) -> Option<String> {
  let len = s.chars().count();
  let mut s = s.clone();
  if amt > len {
    None
  } else {
    s.drain(len - amt..len);
    Some(s)
  }
}
```

Now, the first thing we want to do is get the name of the target struct:
```rs
// get the name of the struct we are deriving on
let name_ident = (parse_macro_input!(input as DeriveInput)).ident;
let name_str = name_ident.to_string();
```

And now loop over all of the enums, and also check now for only the ones we care about:
```rs
for (enum_name, submod_name) in ENUMS {
  if !name_str.ends_with(enum_name) {
    continue;
  }
}
```

Now, we can trim the enum name to get the name of the enum case (`StrLitExpr` - `Expr` = `StrLit`, etc.):
```rs
let trimmed_name = remove_last_chars(enum_name.len(), &name_str);
let trimmed_name = match trimmed_name {
  Some(s) => s,
  None => continue,
};

if trimmed_name.is_empty() {
  continue;
}
```

Now, we have everything we need, so we'll turn them into idents:
```rs
let trimmed_name = Ident::new(&trimmed_name.as_str(), name_ident.span());
let enum_name = Ident::new(enum_name, Span::call_site().into());
let submod_name = Ident::new(submod_name, Span::call_site().into());
```

And finally, we'll construct the relevant `From<>` impls from before:
```rs
return quote! {
  #[automatically_derived]
  impl From<#name_ident> for crate::#submod_name::#enum_name {
    #[inline(always)]
    fn from(item: #name_ident) -> crate::#submod_name::#enum_name {
      crate::#submod_name::#enum_name::#trimmed_name(item)
    }
  }

  #[automatically_derived]
  impl From<#name_ident> for Box<crate::#submod_name::#enum_name> {
    #[inline(always)]
    fn from(item: #name_ident) -> Box<crate::#submod_name::#enum_name> {
      Box::new(item.into())
    }
  }
}
.into();
```

Finally, outside of the for loop, in case none of the enums match, we'll add a fallback:
```rs
// we didn't implement any enums, so return empty
TokenStream::default()
```

And there we go! Add `#[derive(Ast)]` to our stuff, and we get automatic type conversions 🎉!

[*Previous*](oxidation-1)
~~*Next*~~