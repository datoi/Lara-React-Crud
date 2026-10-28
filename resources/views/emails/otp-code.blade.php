@extends('emails.layout')

@section('title', 'Kere — დადასტურების კოდი')

@section('content')
  <h1>გამარჯობა, {{ $firstName }}!</h1>
  <p>ელფოსტის დასადასტურებლად გამოიყენეთ ქვემოთ მოცემული კოდი. კოდი მოქმედებს {{ $minutes }} წუთის განმავლობაში.</p>

  <div class="code-box">{{ $code }}</div>

  <p class="muted">თუ ეს კოდი თქვენ არ მოგითხოვიათ, უბრალოდ უგულებელყავით ეს წერილი.</p>
@endsection
