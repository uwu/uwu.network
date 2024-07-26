---
layout: "^layouts/QuietLayout.astro"
title: C# program heirarchy
description: the organisation of a c# module
pubDate: "2022-05-04"
physPubDate: "2024-07-26"
tags: ["MIGRATED"]
---

*note: migrated over from my website at https://yellows.ink/heirarchycs*

# The hierarchy of a C# (.NET) program

## Quick note

Terms:

- C# - the programming lang focused on here
- .NET - the implementation and libraries around C#
- CLI - common language infrastructure - the actual underlying tech of .NET that defines much of how things work

No guarantee this is useful or well explained, I threw this together for someone on Discord, however since I do have a fairly intimate knowledge of C#, I'm willing to say that this is accurate, especially with some cross checking to MS docs.

I highly recommend you refer to the Microsoft Documentation for anything not here or that needs further clarification, the docs are excellent.

## Assemblies

Assemblies represent a group of namespaces. In the real world this takes the form of a .dll file - each dll is a single assembly.

These are the largest unit of organisation in the CLI, yet you almost never interact with them directly in C# - pretty much just one assembly per project and package reference.

Assemblies are also used to control the `internal` keyword, which are a middle ground between `public` (available everywhere) and `private` (there's some nuance, I'll explain later).

It allows you to make values and types that can be used within your assembly freely but not by other assemblies, so your internal logic is sealed away.

Do note however, that there is the ability to mark other assemblies as "friend assemblies" that can view your internals via `InternalsVisibleTo`. This feature isn't really relevant here, but I thought I'd mention it because its a GODSEND for automated testing EG `[assembly: InternalsVisibleTo("MyApp.Tests")]`.

## Namespaces

Namespaces are the largest unit that a programmer interacts with.

Namespaces are essentially a group of types that live under a single name, if you will, a named space for types to live - hence namespace.

It's generally good practice to have one accordingly named namespace per project and hence per assembly, EG MyApp.Backend.csproj -> MyApp.Backend.dll -> MyApp.Backend namespace, however this is not a rule you have to adhere to.

Namespaces are the primary unit used for importing - the `using` statement brings all types in that namespace into scope for that file. (However, `using static` can bring static class members into scope too).

## Types (Classes, Structs, Enums, Records)

Types are designed to be used either to represent a piece of data, or to do a particular job, and are the key component in Object-Oriented Programming. They contain two types of member - static and instance.

Types should be viewed not as an object, but as a blueprint for an object (instances), and a set of rules about how the object can be used and behaves.

However: some types (classes) can be made `static`. This does two things:

- The class cannot have constructors and the default constructor is not available, hence the class is un-constructable and instances of it thus cannot exist.
- All members therefore must be static otherwise they'd be inaccessible.

Oh yeah, by the way, types can sometimes contain other types instead of a namespace containing them. In general, don't really worry about this as while it can be useful in some cases, its usually not useful practice.

### Private

Now is a good time.

- Private members are accessible only to other members of that class. This is the key to encapsulation.
- Private types are available in their parent type.
- Types cannot be private within namespaces, they are internal by default instead of private.

## Members

A member is generally a field, property, or method.

They are private by default.

Methods are functions. That simple.

Fields are just a way to store a chunk of data on a type - like a struct field in C++. Again, that simple.

Properties are kinda like fields, except that instead of just storing data, they are made up of a get and set function. These are implicitly called on access, and let you add additional logic to get and set operations. Commonly used for derived logic, such as if a rectangle type has a left and right coordinate, a width property could do the math on-access instead of being kept in-sync.

### Static

Static members are a bit of a special case, as they don't adhere to a strict hierarchy - they *do* belong to a type, however they are essentially just a way to make a value or method global. Static members are assigned memory at program start and are never garbage collected. There is only one instance of each static member in your whole program.

### Instance

Instance members are a much smaller unit in your program hierarchy, you're bound to have hundreds or thousands of these.

They can either hold a value on a given instance of a type, or be a method.

These members can access members of the current instance of the type, even if less accessible than the current member. They can also access the current instance directly via the `this` keyword - this is useful in constructors which often take arguments whose names shadow (replace in current scope) class members.

## Local values, Parameters, Returns and Refs

Local values are the smallest unit you can interact with. This encompasses a few things:

- local variables, either via `var x = ...`, or pattern matching `x is MyType varName`.
- parameters passed to a function `MyFunc(MyType varName)` - these behave essentially identically to local variables except that they are passed from the caller of the function.
- return values `return x` - these arent really directly interacted with in the same way as a variable but still counts as a unit of data, passed around.
- refs - refs are a way to control how a method uses its args or to pass around a variable or field indirectly via variables. There are many types and weird use rules I'm really not gonna get into now.
