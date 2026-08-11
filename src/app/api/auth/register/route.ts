import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectDB } from '../../../../lib/db';
import User from '../../../../models/User';
import { sendRegistrationEmails } from '../../../../services/email.service';

const RegisterSchema = z.object({
  name:            z.string().min(2,  'Name must be at least 2 characters'),
  username:        z.string().min(3,  'Username must be at least 3 characters')
                             .max(20, 'Username must be 20 characters or less')
                             .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores'),
  email:           z.string().email('Invalid email address'),
  password:        z.string().min(6,  'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = RegisterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, username, email, password } = result.data;

    await connectDB();

    // Check if email already taken
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 }
      );
    }

    // Check if username already taken
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return NextResponse.json(
        { error: 'This username is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await User.create({
      name,
      username: username.toLowerCase(),
      email,
      password:      hashedPassword,
      role:          'user',
      isOnline:      false,
      emailVerified: new Date(),
    });

    // Send welcome + admin emails asynchronously
    sendRegistrationEmails(newUser.name, newUser.email).catch((err) =>
      console.error('Registration email error:', err)
    );

    return NextResponse.json(
      { success: true, message: 'Account created successfully!' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
