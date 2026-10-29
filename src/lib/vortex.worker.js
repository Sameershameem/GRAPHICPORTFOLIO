// The hero vortex on its own thread (see offscreen.js).
import { serve } from './offscreen'
import { create } from './vortex'

serve(create)
